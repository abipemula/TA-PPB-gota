import { SettingsModel } from "../models/settingsModel.js";

export const SettingsController = {
  async getAll(req, res) {
    try {
      const settings = await SettingsModel.getAll();
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const updated = await SettingsModel.update(req.body);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
