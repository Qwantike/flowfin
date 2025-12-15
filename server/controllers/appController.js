import db from '../db.js';

// --- TRANSACTIONS ---

export const getTransactions = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    );
    // Normalize numeric fields coming from Postgres (numeric -> string)
    const rows = result.rows.map(r => ({
      ...r,
      amount: r.amount !== null ? parseFloat(r.amount) : 0,
      label: r.label || 'Perso'
    }));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const addTransactions = async (req, res) => {
  const transactions = req.body; // Expects array
  if (!Array.isArray(transactions)) return res.status(400).json({ message: 'Format invalide' });

  try {
    const results = [];
    for (const tx of transactions) {
      const { name, amount, type, date, label } = tx;
      const result = await db.query(
        'INSERT INTO transactions (user_id, name, amount, type, date, label) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.user.id, name, amount, type, date, label || null]
      );
      const inserted = result.rows[0];
      // Normalize numeric and label before returning to client
      results.push({
        ...inserted,
        amount: inserted.amount !== null ? parseFloat(inserted.amount) : 0,
        label: inserted.label || 'Perso'
      });
    }
    res.status(201).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l\'ajout' });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Transaction supprimée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur suppression' });
  }
};

// --- ASSETS ---

export const getAssets = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM assets WHERE user_id = $1', [req.user.id]);
    // Map DB fields to frontend interface (camelCase)
    const formattedAssets = result.rows.map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      value: parseFloat(a.value),
      yield: parseFloat(a.yield_rate),
      realEstateDetails: a.real_estate_details
    }));
    res.json(formattedAssets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const addAsset = async (req, res) => {
  const { name, category, value, yield: yieldRate, realEstateDetails } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO assets (user_id, name, category, value, yield_rate, real_estate_details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, name, category, value, yieldRate, realEstateDetails]
    );

    const a = result.rows[0];
    res.status(201).json({
      id: a.id,
      name: a.name,
      category: a.category,
      value: parseFloat(a.value),
      yield: parseFloat(a.yield_rate),
      realEstateDetails: a.real_estate_details
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l\'ajout' });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    await db.query('DELETE FROM assets WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Actif supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur suppression' });
  }
};

// --- CURRENT ACCOUNT (Compte courant) ---

export const getCurrentAccount = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM current_accounts WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      // initialize
      const ins = await db.query(
        'INSERT INTO current_accounts (user_id, balance, last_update_at) VALUES ($1, $2, CURRENT_DATE) RETURNING *',
        [req.user.id, 0]
      );
      const row = ins.rows[0];
      return res.json({ balance: row.balance !== null ? parseFloat(row.balance) : 0, last_update_at: row.last_update_at });
    }
    const row = result.rows[0];
    return res.json({ balance: row.balance !== null ? parseFloat(row.balance) : 0, last_update_at: row.last_update_at });
  } catch (err) {
    console.error('getCurrentAccount error:', err);
    // Detailed error for debugging (remove or simplify in production)
    res.status(500).json({ message: 'Erreur chargement compte courant', error: err.message, stack: err.stack });
  }
};

export const manualUpdateCurrentAccount = async (req, res) => {
  const { balance } = req.body;
  if (balance === undefined || balance === null) return res.status(400).json({ message: 'balance requis' });
  try {
    // upsert: try update, else insert
    const up = await db.query(
      'UPDATE current_accounts SET balance = $1, last_update_at = CURRENT_DATE WHERE user_id = $2 RETURNING *',
      [balance, req.user.id]
    );
    let row;
    if (up.rows.length === 0) {
      const ins = await db.query('INSERT INTO current_accounts (user_id, balance, last_update_at) VALUES ($1, $2, CURRENT_DATE) RETURNING *', [req.user.id, balance]);
      row = ins.rows[0];
    } else {
      row = up.rows[0];
    }
    return res.json({ balance: row.balance !== null ? parseFloat(row.balance) : 0, last_update_at: row.last_update_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur mise à jour manuelle' });
  }
};

export const autoUpdateCurrentAccount = async (req, res) => {
  try {
    // Ensure account exists
    const acctRes = await db.query('SELECT * FROM current_accounts WHERE user_id = $1', [req.user.id]);
    let account;
    if (acctRes.rows.length === 0) {
      const ins = await db.query('INSERT INTO current_accounts (user_id, balance, last_update_at) VALUES ($1, $2, CURRENT_DATE) RETURNING *', [req.user.id, 0]);
      account = ins.rows[0];
    } else {
      account = acctRes.rows[0];
    }

    const lastUpdate = account.last_update_at;

    // Sum net effect of transactions after last_update_at up to today
    const sumRes = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0) AS net
       FROM transactions
       WHERE user_id = $1 AND date > $2::date AND date <= CURRENT_DATE`,
      [req.user.id, lastUpdate]
    );

    const net = sumRes.rows[0]?.net !== null ? parseFloat(sumRes.rows[0].net) : 0;

    if (net === 0) {
      // nothing to apply; still update last_update_at to today
      const upd = await db.query('UPDATE current_accounts SET last_update_at = CURRENT_DATE WHERE user_id = $1 RETURNING *', [req.user.id]);
      const row = upd.rows[0];
      return res.json({ balance: row.balance !== null ? parseFloat(row.balance) : 0, last_update_at: row.last_update_at });
    }

    const newBal = parseFloat(account.balance) + net;
    const up2 = await db.query('UPDATE current_accounts SET balance = $1, last_update_at = CURRENT_DATE WHERE user_id = $2 RETURNING *', [newBal, req.user.id]);
    const row = up2.rows[0];
    return res.json({ balance: row.balance !== null ? parseFloat(row.balance) : 0, last_update_at: row.last_update_at, applied: net });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur mise à jour automatique' });
  }
};
