'use client'

import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import type { ResolvedClientFeatureMap, SanitizedClientFeatures } from '../../../features/types'
import type { SanitizedClientEditorConfig } from '../types'

export const sanitizeClientFeatures = (
  features: ResolvedClientFeatureMap,
): SanitizedClientFeatures => {
  const sanitized: SanitizedClientFeatures = {
    enabledFeatures: [],
    floatingSelectToolbar: {
      sections: [],
    },

    hooks: {
      load: [],
      save: [],
    },
    nodes: [],
    plugins: [],
    slashMenu: {
      dynamicOptions: [],
      groupsWithOptions: [],
    },
  }

  if (!features?.size) {
    return sanitized
  }

  features.forEach((feature) => {
    if (feature.hooks) {
      if (feature.hooks?.load?.length) {
        sanitized.hooks.load = sanitized.hooks.load.concat(feature.hooks.load)
      }
      if (feature.hooks?.save?.length) {
        sanitized.hooks.save = sanitized.hooks.save.concat(feature.hooks.save)
      }
    }

    if (feature.nodes?.length) {
      sanitized.nodes = sanitized.nodes.concat(feature.nodes)
    }
    if (feature.plugins?.length) {
      feature.plugins.forEach((plugin, i) => {
        sanitized.plugins.push({
          Component: plugin.Component,
          key: feature.key + i,
          position: plugin.position,
        })
      })
    }

    if (feature.floatingSelectToolbar?.sections?.length) {
      for (const section of feature.floatingSelectToolbar.sections) {
        // 1. find the section with the same key or create new one
        let foundSection = sanitized.floatingSelectToolbar.sections.find(
          (sanitizedSection) => sanitizedSection.key === section.key,
        )
        if (!foundSection) {
          foundSection = {
            ...section,
            entries: [],
          }
        } else {
          sanitized.floatingSelectToolbar.sections =
            sanitized.floatingSelectToolbar.sections.filter(
              (sanitizedSection) => sanitizedSection.key !== section.key,
            )
        }

        // 2. Add options to group options array and add to sanitized.slashMenu.groupsWithOptions
        if (section?.entries?.length) {
          foundSection.entries = foundSection.entries.concat(section.entries)
        }
        sanitized.floatingSelectToolbar?.sections.push(foundSection)
      }
    }

    if (feature.slashMenu?.options) {
      if (feature.slashMenu.dynamicOptions?.length) {
        sanitized.slashMenu.dynamicOptions = sanitized.slashMenu.dynamicOptions.concat(
          feature.slashMenu.dynamicOptions,
        )
      }

      for (const optionGroup of feature.slashMenu.options) {
        // 1. find the group with the same name or create new one
        let group = sanitized.slashMenu.groupsWithOptions.find(
          (group) => group.key === optionGroup.key,
        )
        if (!group) {
          group = {
            ...optionGroup,
            options: [],
          }
        } else {
          sanitized.slashMenu.groupsWithOptions = sanitized.slashMenu.groupsWithOptions.filter(
            (group) => group.key !== optionGroup.key,
          )
        }

        // 2. Add options to group options array and add to sanitized.slashMenu.groupsWithOptions
        if (optionGroup?.options?.length) {
          group.options = group.options.concat(optionGroup.options)
        }
        sanitized.slashMenu.groupsWithOptions.push(group)
      }
    }

    sanitized.enabledFeatures.push(feature.key)
  })

  // Sort sanitized.floatingSelectToolbar.sections by order property
  sanitized.floatingSelectToolbar.sections.sort((a, b) => {
    if (a.order && b.order) {
      return a.order - b.order
    } else if (a.order) {
      return -1
    } else if (b.order) {
      return 1
    } else {
      return 0
    }
  })

  // Sort sanitized.floatingSelectToolbar.sections.[section].entries by order property
  for (const section of sanitized.floatingSelectToolbar.sections) {
    section.entries.sort((a, b) => {
      if (a.order && b.order) {
        return a.order - b.order
      } else if (a.order) {
        return -1
      } else if (b.order) {
        return 1
      } else {
        return 0
      }
    })
  }

  return sanitized
}

export function sanitizeClientEditorConfig(
  lexical: LexicalEditorConfig,
  resolvedClientFeatureMap: ResolvedClientFeatureMap,
): SanitizedClientEditorConfig {
  return {
    features: sanitizeClientFeatures(resolvedClientFeatureMap),
    lexical,
    resolvedFeatureMap: resolvedClientFeatureMap,
  }
}