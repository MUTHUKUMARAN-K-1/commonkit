import {checkEvidence, MAX_EVIDENCE_BYTES} from './case-model.js';

const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const link = (href, text, className) => {
  const element = node('a', text, className);
  element.href = href;
  if (href.startsWith('https://')) { element.target = '_blank'; element.rel = 'noopener noreferrer'; }
  return element;
};
const receiptLink = hash => link(`https://testnet.nearblocks.io/txns/${encodeURIComponent(hash)}`, 'Transaction ↗', 'cf-receipt');

/** Read-only presentation. File matches never set blockchain verification state. */
export function createCaseFile(container) {
  let generation = 0;
  let requests = [];
  let checks = new Map();

  function invalidate() {
    generation++;
    for (const controller of requests) controller.abort();
    requests = [];
    checks = new Map();
  }

  function trackCheck(id, text = 'Chain receipt · not checked') {
    const status = node('span', text, 'cf-chain-status');
    status.dataset.state = 'pending';
    if (!checks.has(id)) checks.set(id, []);
    checks.get(id).push(status);
    return status;
  }

  function reset(flow) {
    invalidate();
    container.setAttribute('aria-busy', 'true');
    container.replaceChildren(node('p', 'THE CASE FILE', 'eyebrow'), node('h2', flow === 'dispute' ? 'Read the dispute, step by step.' : 'Read the return, step by step.'), node('p', 'Loading the recorded evidence and payment trail…', 'cf-loading'));
  }

  function evidenceCard(item, index, token) {
    const card = node('article', undefined, `cf-evidence-card${item.id === 'decision' ? ' cf-decision' : ''}`);
    card.dataset.evidenceId = item.id;
    const headingId = `case-${item.id}-title`;
    card.setAttribute('aria-labelledby', headingId);
    const top = node('div', undefined, 'cf-card-top');
    top.append(node('span', String(index + 1).padStart(2, '0'), 'cf-index'), node('span', item.role, 'cf-role'));
    const title = node('h4', item.title); title.id = headingId;
    card.append(top, title, node('p', item.signerId, 'cf-account'));
    if (item.note) card.append(node('p', item.note, 'cf-explanation'));
    const fixture = node('blockquote', 'Reading the published synthetic fixture…', 'cf-fixture');
    const fixtureStatus = node('p', 'Published file · checking fingerprint', 'cf-file-status');
    fixtureStatus.setAttribute('role', 'status');
    const resources = node('div', undefined, 'cf-links');
    const download = link(item.fileUrl, 'Download fixture ↓'); download.download = `${item.id}.txt`;
    resources.append(download, receiptLink(item.transactionHash));
    card.append(fixture, fixtureStatus, resources, trackCheck(item.checkId));

    const details = node('details', undefined, 'cf-fingerprints');
    details.append(node('summary', 'Inspect fingerprints'));
    const hashes = node('dl');
    hashes.append(node('dt', 'Expected SHA-256'), node('dd', item.expectedHash));
    const actual = node('dd', 'No local file checked.');
    hashes.append(node('dt', 'Your file’s SHA-256'), actual);
    details.append(hashes);
    card.append(details);

    const field = node('div', undefined, 'cf-file-check');
    const inputId = `case-${item.id}-file`;
    const input = node('input'); input.type = 'file'; input.id = inputId;
    const label = node('label', `Check your ${item.id} file`); label.htmlFor = inputId;
    const localStatus = node('p', 'No local file selected. Maximum 25 MiB.', 'cf-local-result');
    localStatus.id = `${inputId}-result`; localStatus.setAttribute('role', 'status');
    input.setAttribute('aria-describedby', localStatus.id);
    const clear = node('button', 'Clear file', 'cf-clear'); clear.type = 'button'; clear.disabled = true;
    let selection = 0;
    function clearFile() {
      selection++;
      input.value = '';
      clear.disabled = true;
      localStatus.textContent = 'No local file selected. Maximum 25 MiB.';
      delete localStatus.dataset.state;
      actual.textContent = 'No local file checked.';
    }
    clear.addEventListener('click', clearFile);
    input.addEventListener('cancel', clearFile);
    input.addEventListener('change', async () => {
      const chosen = input.files?.[0];
      if (!chosen) { clearFile(); return; }
      const currentSelection = ++selection;
      const current = () => generation === token && selection === currentSelection;
      clear.disabled = false;
      actual.textContent = 'Computing locally…';
      localStatus.textContent = 'Checking this file on your device…';
      delete localStatus.dataset.state;
      try {
        if (chosen.size > MAX_EVIDENCE_BYTES) throw Error('Choose a file of 25 MiB or smaller.');
        const bytes = await chosen.arrayBuffer();
        if (!current()) return;
        const result = await checkEvidence(bytes, item.expectedHash);
        if (!current()) return;
        actual.textContent = result.actualHash;
        localStatus.dataset.state = result.matches ? 'match' : 'mismatch';
        localStatus.textContent = result.matches ? 'File matches the recorded fingerprint. This verifies the bytes, not physical condition.' : 'File does not match the recorded fingerprint. The recorded evidence has not changed.';
      } catch (error) {
        if (!current()) return;
        actual.textContent = 'Could not compute this fingerprint.';
        localStatus.dataset.state = 'error';
        localStatus.textContent = `File not checked: ${error.message || 'The file could not be read.'}`;
      }
    });
    field.append(label, input, clear, localStatus);
    card.append(field);

    const controller = new AbortController();
    requests.push(controller);
    // Only the public, allowlisted fixture is fetched. Personal files never leave this device.
    (async () => {
      try {
        if (!/^\/verification\/vercel\/(normal|dispute)\/evidence\/(pickup|return|damage|decision)\.txt$/.test(item.fileUrl)) throw Error('Unexpected fixture location.');
        const response = await fetch(item.fileUrl, {cache: 'no-store', signal: controller.signal});
        if (!response.ok) throw Error(`File unavailable (HTTP ${response.status}).`);
        const size = Number(response.headers.get('content-length'));
        if (size > MAX_EVIDENCE_BYTES) throw Error('Published fixture exceeds the size limit.');
        const bytes = await response.arrayBuffer();
        if (generation !== token) return;
        const result = await checkEvidence(bytes, item.expectedHash);
        if (generation !== token) return;
        if (!result.matches) throw Error('Published file does not match the recorded fingerprint.');
        fixture.textContent = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
        fixtureStatus.textContent = 'Published file matches the recorded fingerprint.';
        fixtureStatus.dataset.state = 'match';
      } catch (error) {
        if (generation !== token) return;
        fixture.textContent = 'Published fixture text could not be authenticated against its recorded fingerprint.';
        fixtureStatus.textContent = error.name === 'AbortError' ? 'Published file check cancelled.' : `Published file not checked: ${error.message || 'File unavailable.'}`;
        fixtureStatus.dataset.state = 'error';
      }
    })();
    return card;
  }

  function load(model) {
    invalidate();
    const token = generation;
    container.setAttribute('aria-busy', 'false');
    const heading = node('div', undefined, 'cf-heading');
    const introduction = node('div');
    introduction.append(node('p', `CASE FILE / BOOKING #${model.bookingId}`, 'eyebrow'));
    const title = node('h2', model.title); title.id = 'case-file-title';
    introduction.append(title, node('p', model.description, 'cf-intro'));
    const provenance = node('aside', undefined, 'cf-provenance');
    const date = new Date(model.recordedAt);
    const day = Number.isNaN(date.valueOf()) ? 'Capture date unavailable' : new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}).format(date);
    provenance.append(node('strong', 'Recorded rehearsal'), node('span', `Synthetic evidence · ${day}`), node('span', 'Both council accounts belong to one demo operator.'));
    heading.append(introduction, provenance);

    const allocation = node('div', undefined, 'cf-allocation');
    const principal = node('div', undefined, 'cf-principal');
    principal.append(node('span', 'Recorded principal'), node('strong', `${model.amounts.principal} NEAR`), node('small', `${model.amounts.bond} bond + ${model.amounts.fee} usage fee`));
    allocation.append(principal);
    for (const [label, amount, checkId] of [['Borrower refund', model.amounts.borrower, 'borrower-paid'], ['DAO fee + damage', model.amounts.dao, 'dao-paid']]) {
      const payment = node('div', undefined, 'cf-payment');
      payment.append(node('span', model.flow === 'normal' && checkId === 'dao-paid' ? 'DAO usage fee' : label), node('strong', `${amount} NEAR`), trackCheck(checkId, 'Payment · not checked'));
      allocation.append(payment);
    }

    const body = node('div', undefined, 'cf-body');
    const files = node('div', undefined, 'cf-evidence');
    files.append(node('h3', model.flow === 'dispute' ? 'From handover to decision' : 'Handover & return'));
    const fixtureNote = node('p', `These are unchanged synthetic files reused for this rehearsal. A fixture may still say “Booking #${model.flow === 'normal' ? 5 : 1}”; its transaction binds these exact bytes to the selected booking. No real equipment condition is claimed.`, 'cf-fixture-note');
    files.append(fixtureNote);
    const grid = node('div', undefined, 'cf-evidence-grid');
    model.evidence.forEach((item, index) => grid.append(evidenceCard(item, index, token)));
    files.append(grid);
    const trail = node('aside', undefined, 'cf-trail');
    trail.append(node('p', 'DECISION → PAYMENT', 'eyebrow'), node('h3', 'Follow the authority.'), node('p', 'Recorded actions, checked against fresh chain receipts. Settlement creates credits; withdrawals move funds.', 'cf-trail-intro'));
    const events = node('ol', undefined, 'cf-events');
    model.events.forEach((event, index) => {
      const row = node('li');
      row.append(node('span', String(index + 1).padStart(2, '0'), 'cf-event-number'), node('h4', event.title), node('p', event.description, 'cf-event-description'));
      if (event.signerId) row.append(node('p', event.signerId, 'cf-account'));
      row.append(trackCheck(event.checkId));
      const sources = node('div', undefined, 'cf-links');
      if (event.transactionHash) sources.append(receiptLink(event.transactionHash));
      if (event.checkpointUrl) sources.append(link(event.checkpointUrl, 'Saved checkpoint ↗'));
      row.append(sources); events.append(row);
    });
    trail.append(events);
    body.append(files, trail);
    const limits = node('div', undefined, 'cf-boundary');
    limits.append(node('strong', 'A file match is not a verdict.'), node('p', 'Your selected file is hashed locally, never uploaded or saved by this page. A matching fingerprint proves only that the bytes agree with the published claim. Fresh RPC results separately check the recorded transactions; neither check proves physical custody or damage.'), link('#checks', 'Inspect every blockchain check ↓'));
    container.replaceChildren(heading, allocation, body, limits);
  }

  function update(check) {
    const statuses = checks.get(check.id);
    if (!statuses) return;
    for (const status of statuses) {
      const payment = check.id === 'dao-paid' || check.id === 'borrower-paid';
      status.dataset.state = check.status === 'PASS' ? 'verified' : check.status === 'FAIL' ? 'mismatch' : 'unverified';
      status.textContent = check.status === 'PASS' ? (payment ? 'Payment verified on chain' : 'Chain receipt verified') : check.status === 'FAIL' ? 'Chain evidence mismatch' : 'Chain evidence unavailable';
      status.title = check.detail || check.label || '';
    }
  }

  function fail(message) {
    invalidate();
    container.setAttribute('aria-busy', 'false');
    const detail = String(message).replace(/^Case file unavailable:\s*/i, '');
    const error = node('p', `Case file unavailable: ${detail}`, 'cf-error'); error.setAttribute('role', 'status');
    container.replaceChildren(node('p', 'THE CASE FILE', 'eyebrow'), node('h2', 'The evidence could not be loaded.'), error, node('p', 'No file match or payment confirmation is inferred. Run the checks again when the connection is available.', 'cf-intro'));
  }

  return {reset, load, update, fail};
}
