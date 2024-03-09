const Case = require("../models/caseModel");

exports.createCase = async (req, res, next) => {
  const singleCase = await Case.create(req.body);

  res.status(201).json({
    data: singleCase,
  });
};

exports.getCases = async (req, res, next) => {
  const cases = await Case.find({});

  res.status(200).json({
    results: cases.length,
    data: cases,
  });
};
