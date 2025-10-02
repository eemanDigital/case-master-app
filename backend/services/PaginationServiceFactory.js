// services/PaginationServiceFactory.js
const GenericPaginationService = require("./GenericPaginationService");
const modelConfigs = require("../config/modelConfigs");

class PaginationServiceFactory {
  static createService(model, customConfig = {}) {
    const modelName = model.modelName;
    const baseConfig = modelConfigs[modelName] || {};
    const finalConfig = { ...baseConfig, ...customConfig };

    return new GenericPaginationService(model, finalConfig);
  }
}

module.exports = PaginationServiceFactory;
