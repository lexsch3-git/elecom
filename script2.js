'use strict';

// Edit the default figures in index.html; calculations update automatically.
const $ = (id) => document.getElementById(id);
const value = (id) => $(id).value.trim();
const count = (id) => Math.max(0, Number(value(id)) || 0);
const dash = (v) => v || '________________';
const formatDate = (v) => {
  if (!v) return '________________';
  const [year, month, day] = v.split('-');
  return `${month}/${day}/${year}`;
};

function update() {
  const eligible = Math.max(1, count('eligible'));
  const receipts = count('receipts');
  const minimum = Math.floor(eligible / 2) + 1;
  const inPerson = count('inPerson');
  const proxy = count('proxy');
  const totalVotes = inPerson + proxy;
  const receiptPct = (receipts / eligible * 100).toFixed(2) + '%';
  const turnout = (totalVotes / eligible * 100).toFixed(2) + '%';
  const data = {
    assoc: value('association'), registry: value('registry'),
    electionDate: formatDate(value('electionDate')),
    venue: value('venue'), time: value('time'), authority: value('authority'),
    chair: value('chair'), member2: value('member2'), member3: value('member3'),
    eligible, receipts, inPerson, proxy, totalVotes, receiptPct, turnout,
    minimum, distributed: count('distributed'), signed: count('signed'),
    other: count('other'), unresolved: count('unresolved'),
    valid: count('valid'), invalid: count('invalid'),
    quorumFormula: `floor(${eligible} / 2) + 1 = ${minimum}; ${receipts} / ${eligible} × 100 = ${receiptPct}.`
  };
  Object.entries(data).forEach(([key, text]) => {
    document.querySelectorAll(`.${key}`).forEach((el) => { el.textContent = dash(String(text)); });
  });
  $('statEligible').textContent = eligible;
  $('statMinimum').textContent = minimum;
  $('statReceipts').textContent = receipts;
  $('statTurnout').textContent = turnout;
  $('formula').textContent = data.quorumFormula + ` Actual votes: ${totalVotes} / ${eligible} × 100 = ${turnout}.`;
  const reached = receipts >= minimum;
  $('quorumStatus').textContent = reached ? 'Numerical quorum threshold reached — verify receipts before certifying.' : 'Numerical quorum threshold NOT reached.';
  $('quorumStatus').style.color = reached ? '#116b4c' : '#a33b26';
  const mismatch = receipts > eligible || totalVotes > eligible || count('signed') + count('other') < receipts;
  if (mismatch) $('quorumStatus').textContent += ' Review counts for inconsistencies.';
  renderCandidates();
}

function renderCandidates() {
  const candidates = value('candidates').split('\n').map((line) => {
    const [name, votes] = line.split('|').map((part) => part.trim());
    return { name, votes: votes === undefined ? '' : votes };
  }).filter((candidate) => candidate.name);
  const rows = candidates.length ? candidates : Array.from({length: 8}, (_, i) => ({name: `Candidate ${i + 1}: __________`, votes: ''}));
  const canvass = $('canvassRows');
  canvass.replaceChildren();
  rows.forEach((candidate, i) => {
    const tr = document.createElement('tr');
    [i + 1, candidate.name, candidate.votes || '________'].forEach((cell) => {
      const td = document.createElement('td'); td.textContent = cell; tr.appendChild(td);
    });
    canvass.appendChild(tr);
  });
  const winners = $('winnerRows');
  winners.replaceChildren();
  // Never automatically proclaim winners: ties, disputes, and eligibility require human review.
  for (let i = 1; i <= 5; i++) {
    const tr = document.createElement('tr');
    [i, '________________________', '________'].forEach((cell) => {
      const td = document.createElement('td'); td.textContent = cell; tr.appendChild(td);
    });
    winners.appendChild(tr);
  }
}

for (const field of document.querySelectorAll('input, textarea')) field.addEventListener('input', update);
for (const button of document.querySelectorAll('[data-tab]')) {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === button)));
    document.querySelectorAll('.tabpanel').forEach((p) => p.classList.toggle('hidden', p.id !== button.dataset.tab));
  });
}
for (const button of document.querySelectorAll('[data-print]')) {
  button.addEventListener('click', () => {
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('printing'));
    $(button.dataset.print).classList.add('printing');
    window.print();
  });
}
window.addEventListener('afterprint', () => document.querySelectorAll('.panel').forEach((p) => p.classList.remove('printing')));
update();
