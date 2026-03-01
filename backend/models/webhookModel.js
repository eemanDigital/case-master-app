const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema({
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    required: true,
    index: true,
  },

  name: {
    type: String,
    required: true,
    trim: true,
  },

  url: {
    type: String,
    required: true,
  },

  secret: {
    type: String,
    required: true,
  },

  events: [{
    type: String,
    enum: [
      "matter.created",
      "matter.updated",
      "matter.deleted",
      "matter.status_changed",
      "task.created",
      "task.updated",
      "task.completed",
      "invoice.created",
      "invoice.paid",
      "invoice.overdue",
      "payment.created",
      "user.created",
      "user.updated",
      "calendar.event.created",
      "calendar.event.updated",
    ],
  }],

  isActive: {
    type: Boolean,
    default: true,
  },

  headers: {
    type: Map,
    of: String,
  },

  retryPolicy: {
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10,
    },
    retryInterval: {
      type: Number,
      default: 60000,
    },
  },

  lastTriggeredAt: {
    type: Date,
  },

  lastStatus: {
    type: String,
    enum: ["SUCCESS", "FAILED", "PENDING"],
  },

  lastError: {
    type: String,
  },

  triggerCount: {
    type: Number,
    default: 0,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

webhookSchema.index({ firmId: 1, isActive: 1 });
webhookSchema.index({ firmId: 1, events: 1 });

webhookSchema.methods.trigger = async function (event, payload) {
  const WebhookDelivery = mongoose.model("WebhookDelivery");

  const delivery = new WebhookDelivery({
    webhookId: this._id,
    firmId: this.firmId,
    event,
    payload,
    status: "PENDING",
  });

  const signature = this.generateSignature(payload);

  try {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event,
        "X-Webhook-Id": this._id.toString(),
        ...Object.fromEntries(this.headers || new Map()),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const responseBody = await response.text();

    delivery.status = response.ok ? "SUCCESS" : "FAILED";
    delivery.responseStatus = response.status;
    delivery.responseBody = responseBody;
    delivery.completedAt = new Date();

    this.lastTriggeredAt = new Date();
    this.lastStatus = delivery.status;
    this.triggerCount += 1;

    if (!response.ok) {
      this.lastError = `HTTP ${response.status}: ${responseBody.substring(0, 100)}`;
    }

    await Promise.all([delivery.save(), this.save()]);

    return { success: response.ok, delivery };
  } catch (error) {
    delivery.status = "FAILED";
    delivery.errorMessage = error.message;
    delivery.completedAt = new Date();

    this.lastTriggeredAt = new Date();
    this.lastStatus = "FAILED";
    this.lastError = error.message;

    await Promise.all([delivery.save(), this.save()]);

    return { success: false, delivery, error: error.message };
  }
};

webhookSchema.methods.generateSignature = function (payload) {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", this.secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest("hex");
};

webhookSchema.statics.findByEvent = function (firmId, event) {
  return this.find({
    firmId,
    isActive: true,
    events: event,
    isDeleted: { $ne: true },
  });
};

webhookSchema.statics.triggerEvent = async function (firmId, event, payload) {
  const webhooks = await this.findByEvent(firmId, event);

  const results = await Promise.allSettled(
    webhooks.map((webhook) => webhook.trigger(event, payload))
  );

  return results;
};

const Webhook = mongoose.model("Webhook", webhookSchema);

const webhookDeliverySchema = new mongoose.Schema({
  webhookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Webhook",
    required: true,
    index: true,
  },

  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    required: true,
    index: true,
  },

  event: {
    type: String,
    required: true,
  },

  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING",
  },

  responseStatus: {
    type: Number,
  },

  responseBody: {
    type: String,
  },

  errorMessage: {
    type: String,
  },

  attempts: {
    type: Number,
    default: 0,
  },

  startedAt: {
    type: Date,
    default: Date.now,
  },

  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

webhookDeliverySchema.index({ webhookId: 1, createdAt: -1 });
webhookDeliverySchema.index({ firmId: 1, status: 1, createdAt: -1 });

const WebhookDelivery = mongoose.model("WebhookDelivery", webhookDeliverySchema);

module.exports = { Webhook, WebhookDelivery };
