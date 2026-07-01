'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { resolveComponent } from './catalog-registry'
import type { LayoutSpec, LayoutNode } from '@/types'

interface Props {
  spec: LayoutSpec
  taskData?: Record<string, unknown>
}

function SafeComponent({ Component, props, children }: { Component: React.ComponentType<Record<string, unknown>>; props: Record<string, unknown>; children?: React.ReactNode }) {
  try {
    return <Component {...props}>{children}</Component>
  } catch {
    return <p className="text-xs text-white/30 italic">Component unavailable</p>
  }
}

function LayoutNodeRenderer({ node, taskData, index }: { node: LayoutNode; taskData?: Record<string, unknown>; index: number }) {
  const Component = resolveComponent(node.component)

  if (!Component) {
    console.warn(`[GenUI] Unknown component: "${node.component}" — skipped`)
    return null
  }

  const props = { ...node.props, ...taskData }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-6"
    >
      <SafeComponent Component={Component as React.ComponentType<Record<string, unknown>>} props={props}>
        {node.children?.map((child, i) => (
          <LayoutNodeRenderer key={child.id} node={child} taskData={taskData} index={i} />
        ))}
      </SafeComponent>
    </motion.div>
  )
}

export function GenUIRenderer({ spec, taskData }: Props) {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={spec.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {spec.title && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <h2 className="text-lg font-bold gradient-text">{spec.title}</h2>
              {spec.description && (
                <p className="text-sm text-white/50 mt-1">{spec.description}</p>
              )}
            </motion.div>
          )}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 [&>*:first-child:only-child]:md:col-span-2 [&>*:first-child:only-child]:lg:col-span-3">
            {spec.layout.map((node, i) => (
              <LayoutNodeRenderer key={node.id} node={node} taskData={taskData} index={i} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
