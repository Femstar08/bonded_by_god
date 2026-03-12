'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InspirationBoardProps {
  projectId: string
  initialImages: string[]
}

export function InspirationBoard({ projectId, initialImages }: InspirationBoardProps) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [inputUrl, setInputUrl] = useState('')

  const updateDb = async (newImages: string[]) => {
    const supabase = createClient()
    await supabase
      .from('ltu_projects')
      .update({ inspiration_images: newImages })
      .eq('id', projectId)
  }

  const addImage = () => {
    const url = inputUrl.trim()
    if (!url || !url.startsWith('http')) return
    const newImages = [...images, url]
    setImages(newImages)
    setInputUrl('')
    updateDb(newImages)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    updateDb(newImages)
  }

  const handleImageError = (index: number) => {
    removeImage(index)
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Inspiration Board</h3>

      <div className="flex gap-2 mb-3">
        <Input
          type="url"
          placeholder="Paste image URL..."
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addImage()
          }}
          className="text-xs"
        />
        <Button onClick={addImage} size="sm" variant="outline" className="shrink-0">
          Add
        </Button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group aspect-square rounded overflow-hidden bg-muted">
              <img
                src={url}
                alt={`Inspiration ${i + 1}`}
                className="w-full h-full object-cover"
                onError={() => handleImageError(i)}
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Add images that inspire your writing
        </p>
      )}
    </div>
  )
}
