import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

import { version, name } from "../package.json";
import type { Awaitable } from "./types.js";

export const cacheBase = `node_modules/.cache/${name}/fonts/meta`;

export const storage = createStorage({
    // @ts-ignore
	driver: fsDriver({ base: cacheBase }),
});

export async function cachedData<T = unknown>(
	key: string,
	fetcher: () => Awaitable<T>,
	options?: {
		onError?: (err: unknown) => Awaitable<T>;
		ttl?: number;
	},
) {
	const cached = await storage.getItem<null | {
		expires: number;
		version: string;
		data: T;
	}>(key);
	if (!cached || cached.version !== version || cached.expires < Date.now()) {
		try {
			const data = await fetcher();
			await storage.setItem(key, {
				expires: Date.now() + (options?.ttl || 1000 * 60 * 60 * 24 * 7),
				version,
				data,
			});
			return data;
		} catch (err) {
			if (options?.onError) {
				return options.onError(err);
			}
			throw err;
		}
	}
	return cached.data;
}
