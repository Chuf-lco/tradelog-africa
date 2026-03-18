import client from "./client";

export const getDocuments = (shipmentId) =>
  client.get(`/shipments/${shipmentId}/documents`).then((r) => r.data);

export const uploadDocument = (shipmentId, payload) =>
  client.post(`/shipments/${shipmentId}/documents`, payload).then((r) => r.data);

export const deleteDocument = (shipmentId, docId) =>
  client.delete(`/shipments/${shipmentId}/documents/${docId}`).then((r) => r.data);