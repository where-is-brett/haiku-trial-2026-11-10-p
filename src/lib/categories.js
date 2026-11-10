// src/lib/categories.js

// The category keys and labels, in the order they are shown.
export const categories = [
  { key: 'groceries', label: 'Groceries' },
  { key: 'dining', label: 'Eating out' },
  { key: 'transport', label: 'Transport' },
  { key: 'bills', label: 'Bills' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'health', label: 'Health' },
  { key: 'income', label: 'Income' },
  { key: 'other', label: 'Other' },
];

// Shop names and their category keys, in the order the first match wins.
const shops = [
  ['Greenbarrow Fresh', 'groceries'],
  ['Pennywhistle Market', 'groceries'],
  ['Lowtide Grocers', 'groceries'],
  ['Harvest Lane Foods', 'groceries'],
  ['Pasta, Pizza & Co', 'dining'],
  ['Kestrel Coffee Bar', 'dining'],
  ['Saltbush Noodle House', 'dining'],
  ['Ember Grill', 'dining'],
  ['Waverly Fuel Stop', 'transport'],
  ['Tramline Fares', 'transport'],
  ['Lantern Rideshare', 'transport'],
  ['Northgate Parking', 'transport'],
  ['Brightfield Power', 'bills'],
  ['Clearwater Utilities', 'bills'],
  ['Skyline Broadband', 'bills'],
  ['Hollis Insurance', 'bills'],
  ['Marlowe Homewares', 'shopping'],
  ['Quillon Books', 'shopping'],
  ['Fernhill Outfitters', 'shopping'],
  ['Pixel Parade Tech', 'shopping'],
  ['Larkspur Pharmacy', 'health'],
  ['Elmgrove Physio', 'health'],
  ['Cobalt Dental', 'health'],
  ['Sunnyvale Optical', 'health'],
  ['Brightwave Payroll', 'income'],
  ['Tidepool Interest', 'income'],
  ['Oakridge Dividends', 'income'],
];

// Returns the category key of the first shop whose name the description contains, ignoring case.
export function categoryOf(description) {
  if (typeof description !== 'string') return 'other';
  const text = description.toLowerCase();
  const match = shops.find(([name]) => text.includes(name.toLowerCase()));
  return match ? match[1] : 'other';
}
