// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/utils/database';
import { withSessionRoute } from '@/lib/withSession'
import { checkGroupRoles } from '@/utils/permissionsManager'
type Data = {
	success: boolean
	error?: string
}

export default withSessionRoute(handler);

export async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
	const key = req.headers['x-instance-key'];
	if (!key) return res.status(401).json({ success: false, error: 'No key provided' })
	const registryconfig = await prisma.instanceConfig.findFirst({
		where: {
			key: 'registry'
		}
	});
	if (!registryconfig?.value) return res.status(500).json({ success: false, error: 'No registry config found' })
	const regkey = JSON.parse((registryconfig.value as string)).key;
	if (key !== regkey) return res.status(401).json({ success: false, error: 'Invalid key' });
	const workspaces = await prisma.workspace.findMany();
	for (const workspace of workspaces) {
		await checkGroupRoles(workspace.groupId);
	}


	res.status(200).json({ success: true })
}
