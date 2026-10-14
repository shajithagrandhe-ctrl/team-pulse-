import type { Request, Response } from "express";
import { getAgentById, listAgents } from "../services/agent.service.js";

export const getAgents = async (_req: Request, res: Response) => {
  const agents = await listAgents();
  return res.json({
    success: true,
    data: agents,
    message: `Found ${agents.length} agents`
  });
};

export const getAgent = async (req: Request, res: Response) => {
  const agent = await getAgentById(req.params.id);
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: "Agent not found"
    });
  }

  return res.json({
    success: true,
    data: agent,
    message: "Agent details"
  });
};