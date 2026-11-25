import Progress from '../models/progressModel.mjs';

// GET /api/progress - Get current metrics, deltas, and milestones
export const getProgress = async (req, res) => {
  try {
    const records = await Progress.find({ user: req.user.id }).sort({ date: 1 });

    if (records.length === 0) {
      return res.status(200).json({
        weight: "0",
        bodyFat: "0",
        waist: "0",
        benchPress: "0",
        squat: "0",
        deadlift: "0",
        runTime5k: "--",
        deltaWeight: "0 kg",
        deltaBodyFat: "0%",
        deltaWaist: "0 cm",
        deltaBenchPress: "0 kg",
        weightTrend: "New",
        chartData: [],
        milestones: [],
        hasRecords: false,
      });
    }

    const first = records[0];
    const latest = records[records.length - 1];

    // Compute deltas from first entry
    const deltaWeightNum = (latest.weight - first.weight).toFixed(1);
    const deltaWeight = deltaWeightNum > 0 ? `+${deltaWeightNum} kg` : `${deltaWeightNum} kg`;

    const deltaBodyFatNum = (latest.bodyFat && first.bodyFat) 
      ? (latest.bodyFat - first.bodyFat).toFixed(1)
      : 0;
    const deltaBodyFat = deltaBodyFatNum > 0 ? `+${deltaBodyFatNum}%` : `${deltaBodyFatNum}%`;

    const deltaWaistNum = (latest.waist && first.waist)
      ? (latest.waist - first.waist).toFixed(1)
      : 0;
    const deltaWaist = deltaWaistNum > 0 ? `+${deltaWaistNum} cm` : `${deltaWaistNum} cm`;

    const deltaBenchNum = (latest.benchPress && first.benchPress)
      ? (latest.benchPress - first.benchPress).toFixed(1)
      : 0;
    const deltaBench = deltaBenchNum > 0 ? `+${deltaBenchNum} kg` : `${deltaBenchNum} kg`;

    // Dynamic milestones
    const milestones = [];
    if (latest.benchPress && latest.benchPress > 0) {
      milestones.push({
        id: "m-bench",
        title: "Personal Best: Bench Press",
        subtitle: `${latest.benchPress} kg achieved`,
        date: new Date(latest.date).toLocaleDateString([], { month: "short", day: "numeric" }),
        type: "trophy",
      });
    }
    if (records.length >= 3) {
      milestones.push({
        id: "m-consist",
        title: "Consistency Milestone",
        subtitle: `${records.length} progress checkpoints recorded`,
        date: new Date(latest.date).toLocaleDateString([], { month: "short", day: "numeric" }),
        type: "check",
      });
    }
    if (latest.runTime5k) {
      milestones.push({
        id: "m-run",
        title: "5K Running Milestone",
        subtitle: `Clocked ${latest.runTime5k}`,
        date: new Date(latest.date).toLocaleDateString([], { month: "short", day: "numeric" }),
        type: "check",
      });
    }

    // Chart data for weight trend
    const chartData = records.map(r => ({
      date: new Date(r.date).toLocaleDateString([], { month: "short", day: "numeric" }),
      rawDate: r.date,
      weight: r.weight,
      bodyFat: r.bodyFat || 0,
      waist: r.waist || 0,
      benchPress: r.benchPress || 0,
    }));

    res.status(200).json({
      weight: latest.weight.toString(),
      bodyFat: (latest.bodyFat || 0).toString(),
      waist: (latest.waist || 0).toString(),
      benchPress: (latest.benchPress || 0).toString(),
      squat: (latest.squat || 0).toString(),
      deadlift: (latest.deadlift || 0).toString(),
      runTime5k: latest.runTime5k || "--",
      deltaWeight,
      deltaBodyFat,
      deltaWaist,
      deltaBenchPress: deltaBench,
      weightTrend: deltaWeightNum <= 0 ? "Improving" : "Gaining",
      percentChange: first.weight > 0 ? `${(((latest.weight - first.weight) / first.weight) * 100).toFixed(1)}%` : "0%",
      chartData,
      milestones,
      hasRecords: true,
      recordsCount: records.length,
    });
  } catch (error) {
    console.error("getProgress error:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/progress - Add a new measurement
export const addMeasurement = async (req, res) => {
  try {
    const { weight, bodyFat, waist, chest, arms, benchPress, squat, deadlift, runTime5k, date, notes } = req.body;

    if (weight === undefined || weight === null || weight === "") {
      return res.status(400).json({ msg: "Weight is required." });
    }

    const measurementDate = date ? new Date(date) : new Date();

    const newProgress = new Progress({
      user: req.user.id,
      date: measurementDate,
      weight: Number(weight),
      bodyFat: bodyFat ? Number(bodyFat) : undefined,
      waist: waist ? Number(waist) : undefined,
      chest: chest ? Number(chest) : undefined,
      arms: arms ? Number(arms) : undefined,
      benchPress: benchPress ? Number(benchPress) : undefined,
      squat: squat ? Number(squat) : undefined,
      deadlift: deadlift ? Number(deadlift) : undefined,
      runTime5k: runTime5k ? String(runTime5k) : undefined,
      notes: notes || "",
    });

    const saved = await newProgress.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("addMeasurement error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/progress/history - Get chronological progress logs
export const getProgressHistory = async (req, res) => {
  try {
    const history = await Progress.find({ user: req.user.id }).sort({ date: 1 });
    res.status(200).json(history);
  } catch (error) {
    console.error("getProgressHistory error:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/progress/:id - Delete a progress measurement
export const deleteMeasurement = async (req, res) => {
  try {
    const deleted = await Progress.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) {
      return res.status(404).json({ msg: "Measurement not found" });
    }
    res.status(200).json({ msg: "Measurement deleted", id: req.params.id });
  } catch (error) {
    console.error("deleteMeasurement error:", error);
    res.status(500).json({ error: error.message });
  }
};
