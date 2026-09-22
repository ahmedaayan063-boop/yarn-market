const express = require('express');
const router  = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all
router.get('/', async (req, res) => {
  try {
    const txns = await prisma.transaction.findMany({
      include: {
        party:    true,
        contract: true,
        items:    { include: { item: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(txns);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const txn = await prisma.transaction.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        party:    true,
        contract: true,
        items:    { include: { item: true } },
      },
    });
    if (!txn) return res.status(404).json({ error: 'Not found' });
    res.json(txn);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { items, ...data } = req.body;
    const txn = await prisma.transaction.create({
      data: {
        ...data,
        preparedAt: new Date(),
        items: items ? { create: items.map(i => ({
          itemId:    i.itemId    || null,
          quality:   i.quality   || null,
          bags:      i.bags      || null,
          rate:      i.rate      || null,
          amount:    i.amount    || null,
          sortOrder: i.sortOrder || 0,
        })) } : undefined,
      },
      include: { items: { include: { item: true } }, party: true },
    });
    res.status(201).json(txn);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { items, ...data } = req.body;
    const txn = await prisma.transaction.update({
      where: { id: Number(req.params.id) },
      data: {
        ...data,
        ...(items && {
          items: {
            deleteMany: {},
            create: items.map(i => ({
              itemId:    i.itemId    || null,
              quality:   i.quality   || null,
              bags:      i.bags      || null,
              rate:      i.rate      || null,
              amount:    i.amount    || null,
              sortOrder: i.sortOrder || 0,
            }))
          }
        }),
      },
      include: { items: { include: { item: true } }, party: true },
    });
    res.json(txn);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await prisma.transaction.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
