import app from "../serverApp";

export default function handler(req: any, res: any) {
  return app(req, res);
}
