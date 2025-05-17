import { getSession } from "next-auth/react";
import { NextApiRequest, NextApiResponse } from "next";

export function withRole(handler: any, allowedRoles: string[]) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession({ req });
    if (!session) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(session.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return handler(req, res, session);
  };
}
