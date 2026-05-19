const orderService = require('../services/order.service');

const create = async (req, res) => {
  try {
    const order = await orderService.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const getById = async (req, res) => {
  try {
    const order = await orderService.getById(req.params.id);
    res.status(200).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const list = async (req, res) => {
  try {
    const { vendorId, status, cursor, limit } = req.query;
    const result = await orderService.list({ vendorId, status, cursor, limit: parseInt(limit) || 20 });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    const order = await orderService.updateStatus(req.params.id, status);
    res.status(200).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const remove = async (req, res) => {
  try {
    await orderService.remove(req.params.id);
    res.status(200).json({ message: 'Order deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

module.exports = { create, getById, list, updateStatus, remove };