'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectType } from '@/types/database'

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['book', 'sermon', 'devotional', 'notes', 'bible_study', 'article', 'other']),
  role: z.string().min(1, 'Role is required'),
  structure: z.string().optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: 'book', label: 'Book' },
  { value: 'sermon', label: 'Sermon' },
  { value: 'devotional', label: 'Devotional' },
  { value: 'notes', label: 'Notes' },
  { value: 'bible_study', label: 'Bible Study' },
  { value: 'article', label: 'Article' },
  { value: 'other', label: 'Other' },
]

const roles = ['Author', 'Preacher', 'Devotionalist', 'Bible Study Leader', 'Evangelist']

export default function NewProjectPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  })

  const onSubmit = async (data: ProjectFormData) => {
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to create a project')
      setLoading(false)
      return
    }

    // Parse structure if provided
    let structure = null
    if (data.structure && data.structure.trim()) {
      try {
        // Try to parse as JSON first
        structure = JSON.parse(data.structure)
      } catch {
        // If not JSON, treat as plain text and create a simple structure
        const lines = data.structure.split('\n').filter((line) => line.trim())
        structure = { chapters: lines }
      }
    }

    const { data: project, error: projectError } = await supabase
      .from('ltu_projects')
      .insert({
        user_id: user.id,
        title: data.title,
        type: data.type,
        role: data.role,
        content: '',
        structure,
      })
      .select()
      .single()

    if (projectError) {
      setError(projectError.message)
      setLoading(false)
    } else if (project) {
      router.push(`/editor/${project.id}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>Start a new writing project with your chosen role and type</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                placeholder="e.g., My First Book"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Project Type</Label>
              <Select
                onValueChange={(value) => setValue('type', value as ProjectType)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Your Role</Label>
              <Select
                onValueChange={(value) => setValue('role', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="structure">Structure (Optional)</Label>
              <Textarea
                id="structure"
                placeholder="Enter chapter titles or structure, one per line, or paste JSON structure"
                rows={6}
                {...register('structure')}
              />
              <p className="text-sm text-muted-foreground">
                You can enter chapter titles (one per line) or paste a JSON structure
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
