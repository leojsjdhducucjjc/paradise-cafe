// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchworkspace, getConfig, setConfig } from '@/utils/configEngine'
import prisma, { SessionType, Session } from '@/utils/database';
import { withSessionRoute } from '@/lib/withSession'
import { withPermissionCheck } from '@/utils/permissionsManager'

import { getUsername, getThumbnail, getDisplayName } from '@/utils/userinfoEngine'
import * as noblox from 'noblox.js'
type Data = {
	success: boolean
	error?: string
	sessions?: Session[]
}

export default withPermissionCheck(handler);

export async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
	const sessions = await prisma.session.findMany({
		where: {
			sessionType: {
				workspaceGroupId: parseInt(req.query.id as string)
			},
			startedAt: {
				not: null
			},
			ended: null
		},
		include: {
			owner: {
				select: {
					username: true,
					picture: true,
				}
			}
		}
	});
	
	res.status(200).json({ success: true, sessions: JSON.parse(JSON.stringify(sessions, (key, value) => (typeof value === 'bigint' ? value.toString() : value))) })
}
