import {createElement, Library, ClipboardList, UsersRound, ReceiptText, Search, Wallet, Check, Circle, ArrowUpRight, Package, X} from 'lucide';

const icons = {library:Library, bookings:ClipboardList, council:UsersRound, receipt:ReceiptText, search:Search, wallet:Wallet, check:Check, circle:Circle, arrow:ArrowUpRight, equipment:Package, close:X};

export function icon(name) {
  return createElement(icons[name], {width:18, height:18, 'stroke-width':1.5, 'aria-hidden':'true', focusable:'false', class:'ui-icon'});
}

export function mountIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => el.replaceChildren(icon(el.dataset.icon)));
}
