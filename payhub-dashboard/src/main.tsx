import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AppInstitucional } from './AppInstitucional'
import { AppSimples } from './AppSimples'

const el = document.getElementById('root') as HTMLElement
const variant = (import.meta as any).env?.VITE_APP_VARIANT || 'institutional'
const Root = variant === 'institutional' ? AppInstitucional : variant === 'simple' ? AppSimples : App
createRoot(el).render(<Root />)
