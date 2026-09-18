import { HospitalModel } from '../models/hospitalModel.js'

export const HospitalController = {
  async getAll(req, res, next) {
    try {
      const hospitals = await HospitalModel.getAll()
      return res.json({ success: true, hospitals })
    } catch (err) {
      next(err)
    }
  },

  async getPrimary(req, res, next) {
    try {
      const hospital = await HospitalModel.getPrimaryHospital()
      return res.json({ success: true, hospital })
    } catch (err) {
      next(err)
    }
  }
}
