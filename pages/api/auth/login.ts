//logout of tovy

import { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from '@/lib/withSession'
import { getUsername, getThumbnail, getDisplayName } from '@/utils/userinfoEngine'
import { getRobloxUsername, getRobloxThumbnail, getRobloxDisplayName, getRobloxUserId } from "@/utils/roblox";
import bcrypt from 'bcrypt'
import * as noblox from 'noblox.js'
import prisma from '@/utils/database';
import axios from "axios";
import rateLimit from 'express-rate-limit';
import { NextApiHandler } from 'next';

// Rate limtning for login
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 mins
	max: 5, // 5req/15 mins
	message: 'Slow down! Too many login attempts, please try again later.',
	standardHeaders: true, 
	legacyHeaders: false,
	keyGenerator: (req) => {
		// Cloud instances (or if they self host proxied through cloudflare) use cloudflare, so we need to
		// account for the possibility that the instance MIGHT be proxied through cloudflare or might not be
		const cfConnectingIp = req.headers['cf-connecting-ip'];
		const xRealIp = req.headers['x-real-ip'];
		const xForwardedFor = req.headers['x-forwarded-for'];
		const remoteAddress = req.socket.remoteAddress;
		
		// Use CF if available, otherwise fallback to other headers
		return cfConnectingIp as string || 
			   xRealIp as string || 
			   (xForwardedFor as string)?.split(',')[0] || 
			   remoteAddress || 
			   'unknown';
	}
});

const applyRateLimit = (handler: NextApiHandler) => {
	return async (req: NextApiRequest, res: NextApiResponse) => {
		try {
			await new Promise<void>((resolve, reject) => {
				limiter(req as any, res as any, (result: unknown) => {
					if (result instanceof Error) reject(result);
					resolve();
				});
			});
			return handler(req, res);
		} catch (error) {
			return res.status(429).json({ 
				success: false, 
				error: 'Slow down! Too many login attempts, please try again later.' 
			});
		}
	};
};

export default withSessionRoute(applyRateLimit(handler));

type User = {
	userId: number
	username: string
	displayname: string
	thumbnail: string
	isOwner: boolean
}

type DatabaseUser = {
	info: {
		passwordhash: string;
	} | null;
	roles: {
		workspaceGroupId: number;
	}[];
	isOwner: boolean;
}

type DatabaseResponse = DatabaseUser | { error: string };

type response = {
	success: boolean
	error?: string
	user?: User
	workspaces?: {
		groupId: number
		groupthumbnail: string
		groupname: string
	}[]
}

export async function handler(
	req: NextApiRequest,
	res: NextApiResponse<response>
) {
	try {
		if (req.method !== 'POST') {
			return res.status(405).json({ success: false, error: 'Method not allowed' })
		}

		if (!req.body.username || !req.body.password) {
			return res.status(400).json({ success: false, error: 'Username and password are required' })
		}

		const id = await getRobloxUserId(req.body.username, req.headers.origin).catch(e => null) as number | undefined;
		if (!id) {
			return res.status(401).json({ success: false, error: 'Invalid username or password' })
		}

		const user = await prisma.user.findUnique({
			where: {
				userid: id
			},
			select: {
				info: true,
				roles: true,
				isOwner: true
			}
		}).catch(error => {
			console.error('Database error:', error);
			// Check for specific database connection errors
			if (error.name === 'PrismaClientInitializationError') {
				return { error: 'Database connection error' } as DatabaseResponse;
			}
			return null;
		});

		if (user && 'error' in user) {
			return res.status(503).json({ 
				success: false, 
				error: 'Database service is temporarily unavailable. Please try again later.' 
			});
		}

		if (!user || !user.info?.passwordhash) {
			return res.status(401).json({ success: false, error: 'Invalid username or password' })
		}

		const valid = await bcrypt.compare(req.body.password, user.info.passwordhash)
		if (!valid) {
			return res.status(401).json({ success: false, error: 'Invalid username or password' })
		}

		req.session.userid = id
		await req.session?.save()

		const tovyuser: User = {
			userId: req.session.userid,
			username: await getUsername(req.session.userid),
			displayname: await getDisplayName(req.session.userid),
			thumbnail: await getThumbnail(req.session.userid),
			isOwner: user.isOwner || false
		}

		let roles: any[] = [];
		if (user.roles.length) {
			try {
				for (const role of user.roles) {
					const [logo, group] = await Promise.all([
						noblox.getLogo(role.workspaceGroupId),
						noblox.getGroup(role.workspaceGroupId)
					]);
					
					roles.push({
						groupId: role.workspaceGroupId,
						groupThumbnail: logo,
						groupName: group.name,
					})
				}
			} catch (error) {
				console.error('Error fetching group information:', error);
			}
		}

		return res.status(200).json({ success: true, user: tovyuser, workspaces: roles })
	} catch (error) {
		console.error('Login error:', error);
		return res.status(500).json({ success: false, error: 'An unexpected error occurred during login' })
	}
}
