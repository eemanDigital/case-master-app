let api = null;

export function bindNotification(notificationApi) {
  api = notificationApi;
}

function toMessage(value) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "object") return value.message || "Something went wrong";
  return String(value);
}

function toConfig(message, options) {
  const config = { message: toMessage(message) };
  if (options?.autoClose != null) {
    config.duration = options.autoClose / 1000;
  }
  return config;
}

const notify = {
  success: (message, options) => api?.success(toConfig(message, options)),
  error: (message, options) => api?.error(toConfig(message, options)),
  warning: (message, options) => api?.warning(toConfig(message, options)),
  info: (message, options) => api?.info(toConfig(message, options)),
  dismiss: () => api?.destroy(),
};

export default notify;