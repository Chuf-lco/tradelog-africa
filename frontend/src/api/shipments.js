import client from "./client";

export const getShipments = (params) =>
  client.get("/shipments", { params }).then((r) => r.data);

export const getShipment = (id) =>
  client.get(`/shipments/${id}`).then((r) => r.data);

export const createShipment = (payload) =>
  client.post("/shipments", payload).then((r) => r.data);

export const updateShipment = (id, payload) =>
  client.patch(`/shipments/${id}`, payload).then((r) => r.data);

export const updateShipmentStatus = (id, status) =>
  client.patch(`/shipments/${id}/status`, { status }).then((r) => r.data);

export const deleteShipment = (id) =>
  client.delete(`/shipments/${id}`).then((r) => r.data);