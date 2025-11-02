import { configureStore, createSlice } from '@reduxjs/toolkit'

// A lightweight preparedness slice to store user inputs and computed score.
const initialState = {
  household: {
    adults: 1,
    kids: 0,
    elderly: 0,
    pets: 0,
    specialNeeds: false,
  },
  location: {
    zip: '',
    evacuationZone: null,
  },
  medical: {
    needsOxygen: false,
    needsDialysis: false,
    medications: [],
  },
  transport: {
    hasVehicle: true,
    vehiclesAvailable: 1,
  },
  score: 0,
  checklist: [],
  notifications: [],
}

const preparednessSlice = createSlice({
  name: 'preparedness',
  initialState,
  reducers: {
    setHousehold(state, action) {
      state.household = { ...state.household, ...action.payload }
    },
    setLocation(state, action) {
      state.location = { ...state.location, ...action.payload }
    },
    setMedical(state, action) {
      state.medical = { ...state.medical, ...action.payload }
    },
    setTransport(state, action) {
      state.transport = { ...state.transport, ...action.payload }
    },
    setChecklist(state, action) {
      state.checklist = action.payload
    },
    addNotification(state, action) {
      state.notifications.push(action.payload)
    },
    calculateScore(state) {
      // Basic heuristic: start at 100 and subtract for missing essentials.
      let score = 100
      const { household, medical, transport, checklist } = state
      if (household.kids > 0) score -= 5
      if (household.elderly > 0) score -= 5
      if (household.pets > 0) score -= 3
      if (!transport.hasVehicle) score -= 15
      if (medical.needsOxygen || medical.needsDialysis) score -= 20
      // checklist completeness penalty
      if (Array.isArray(checklist) && checklist.length < 8) score -= (8 - checklist.length) * 5
      if (score < 0) score = 0
      state.score = Math.max(0, Math.round(score))
    },
  },
})

export const {
  setHousehold,
  setLocation,
  setMedical,
  setTransport,
  setChecklist,
  addNotification,
  calculateScore,
} = preparednessSlice.actions

const store = configureStore({
  reducer: {
    preparedness: preparednessSlice.reducer,
  },
})

export default store
