import { StockLogModel } from "../models/stockLogModel.js";

export const StockLogController = {
  async getAll(req, res) {
    try {
      const logs = await StockLogModel.getAll();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const log = await StockLogModel.getById(req.params.id);
      res.json(log);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const log = await StockLogModel.create(req.body);
      res.status(201).json(log);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      await StockLogModel.remove(req.params.id);
      res.json({ message: "Stock log deleted successfully" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
