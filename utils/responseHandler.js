const success = (res, payload = {}, message = "Success") => {
  return res.status(200).send({
    status: true,
    message,
    ...payload,
  });
};

const unauthorized = (res, message = "Unauthorized") => {
  return res.status(401).send({
    status: false,
    message,
    data: [],
  });
};

const forbidden = (res, message = "Forbidden") => {
  return res.status(403).send({
    status: false,
    message,
    data: [],
  });
};

const badRequest = (res, message = "Bad Request") => {
  return res.status(400).send({
    status: false,
    message,
    data: [],
  });
};

export default {
  success,
  unauthorized,
  forbidden,
  badRequest,
};
