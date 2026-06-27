import * as fs from "fs";
import * as path from "path";
import streamDeck from "@elgato/streamdeck";

/**
 * Reads a local image file (either absolute or relative to working directory)
 * and applies it to the action as a base64 Data URL.
 * If the path is relative and not found locally, it is assumed to be relative
 * to the plugin bundle and passed directly to Stream Deck.
 * Falls back to a default relative path if loading fails.
 */
export async function applyImageWithFallback(
	action: any,
	filePath: string | undefined,
	fallbackPath: string
): Promise<void> {
	if (filePath) {
		try {
			const resolvedPath = path.resolve(filePath);
			if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
				const buffer = await fs.promises.readFile(resolvedPath);
				const ext = path.extname(resolvedPath).substring(1) || "png";
				// Map extension to correct mime type
				const mimeType = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
				const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
				await action.setImage(base64);
				return;
			} else {
				// Fallback to let Stream Deck handle standard relative paths in the bundle
				await action.setImage(filePath);
				return;
			}
		} catch (error) {
			streamDeck.logger.error(`Error loading image from ${filePath}: ${error}`);
		}
	}
	// Fallback to built-in default image
	await action.setImage(fallbackPath);
}
