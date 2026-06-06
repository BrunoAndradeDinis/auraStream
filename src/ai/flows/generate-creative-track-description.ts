/**
 * AI Flow: Generate Creative Track Description
 *
 * This module generates creative descriptions for music tracks
 * using AI based on the track's metadata (title, artist, genre).
 */

interface TrackMetadata {
  title: string
  artist: string
  genre: string
}

interface DescriptionResult {
  description: string
}

/**
 * Generates a creative description for a track using AI
 *
 * @param metadata - Track metadata including title, artist, and genre
 * @returns Promise resolving to an object containing the generated description
 */
export async function generateCreativeTrackDescription(
  metadata: TrackMetadata,
): Promise<DescriptionResult> {
  try {
    // Call your AI service endpoint
    const response = await fetch('/api/ai/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    })

    if (!response.ok) {
      throw new Error(`AI service error: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.description) {
      throw new Error('Invalid response format from AI service')
    }

    return {
      description: data.description,
    }
  } catch (error) {
    console.error('Error generating track description:', error)
    throw error
  }
}
