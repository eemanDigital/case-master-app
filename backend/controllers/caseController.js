const Case = require("../models/caseModel");

exports.createCase = async (req, res, next) => {
  const singleCase = await Case.create(req.body);

  res.status(201).json({
    data: singleCase,
  });
};

exports.getCases = async (req, res, next) => {
  const cases = await Case.find().populate("task");

  res.status(200).json({
    results: cases.length,
    data: cases,
  });
};

exports.getCase = async (req, res, next) => {
  const _id = req.params.caseId;
  // console.log(id);
  const data = await Case.findById({ _id });

  res.status(200).json({
    data,
  });
};

exports.updateCase = async (req, res, next) => {
  const doc = await Case.findByIdAndUpdate(req.params.caseId, req.body, {
    new: true,
    runValidators: true,
  });
  // console.log(updatedCase);

  res.status(200).json({
    message: "case successfully updated",
    doc,
  });
};

exports.deleteCase = async (req, res, next) => {
  try {
    const _id = req.params.caseId;
    await Case.findByIdAndDelete({ _id });

    res.status(204).json({
      message: "Case deleted",
    });
  } catch (err) {
    res.status(400).json({
      message: "does not exist",
    });
  }
};
