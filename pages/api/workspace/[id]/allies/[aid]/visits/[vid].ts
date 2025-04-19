// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchworkspace, getConfig, setConfig } from '@/utils/configEngine'
import prisma, { allyVisit } from '@/utils/database';
import { withSessionRoute } from '@/lib/withSession'
import { withPermissionCheck } from '@/utils/permissionsManager'
import { getUsername, getThumbnail, getDisplayName } from '@/utils/userinfoEngine'
import * as noblox from 'noblox.js'
type Data = {
	success: boolean
	error?: string
	ally?: any
}

export default withPermissionCheck(handler, 'manage_alliances');

export async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	if (!req.session.userid) return res.status(401).json({ success: false, error: 'Not logged in' });
	if (!req.query.vid) return res.status(400).json({ success: false, error: 'Missing ally id' });
	if (typeof req.query.aid !== 'string') return res.status(400).json({ success: false, error: 'Invalid ally id' })
	if(req.method == "DELETE") {
		try {
			// @ts-ignore
			const visit = await prisma.allyVisit.delete({
				where: {
					// @ts-ignore
					id: req.query.vid
				}
			})
			
	
			return res.status(200).json({ success: true });
		} catch (error) {
			console.error(error);
			return res.status(500).json({ success: false, error: "Something went wrong" });
		}
	} else if (req.method == "PATCH") {
		try {
			if(!req.body.name || !req.body.time) return res.status(400).json({ success: false, error: 'Missing data' })

			// @ts-ignore
			const visit = await prisma.allyVisit.update({
				where: {
					// @ts-ignore
					id: req.query.vid
				},
				data: {
					name: req.body.name,
					time: new Date(req.body.time)
				}
			})
			
	
			return res.status(200).json({ success: true });
		} catch (error) {
			console.error(error);
			return res.status(500).json({ success: false, error: "Something went wrong" });
		}
	} else {
		return res.status(405).json({ success: false, error: 'Method not allowed' })
	}
}
