export function equipmentAvailability(asset,bookings,now){
  if(!asset.enabled)return 'Unavailable';
  const active=Object.values(bookings||{}).filter(b=>b.asset_id===asset.id&&['Reserved','CheckedOut','ReturnPending','Disputed'].includes(b.status)&&(b.status!=='Reserved'||b.end>now));
  if(active.some(b=>b.status!=='Reserved'||b.start<=now&&b.end>now))return 'Currently borrowed';
  return active.length?'Future reservations':'Available to reserve';
}
