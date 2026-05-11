import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase/client'
import { readUserProfile, subscribeUserProfile, writeUserProfile } from '../firebase/db'
import type { UserProfile, UserRole } from '../types'
import { DEFAULT_TENANT_ID } from '../constants'

type AuthState = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  login: (email: string, password: string, role: UserRole) => Promise<void>
  register: (input: {
    email: string
    password: string
    name: string
    role: UserRole
  }) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(true)
      if (u) {
        const p = await readUserProfile(u.uid)
        setProfile(p)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    return subscribeUserProfile(user.uid, setProfile)
  }, [user])

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    let p = await readUserProfile(cred.user.uid)
    if (!p) {
      const u = cred.user
      const name = u.displayName?.trim() || u.email?.split('@')[0] || 'User'
      const prof: UserProfile = {
        role,
        name,
        email: u.email || email.trim(),
        ...(role === 'tenant' ? { tenantId: DEFAULT_TENANT_ID } : {}),
      }
      await writeUserProfile(u.uid, prof)
      p = await readUserProfile(cred.user.uid)
    } else if (p.role !== role) {
      await signOut(auth)
      throw new Error(
        p.role === 'student'
          ? 'Akun ini Mahasiswa. Pilih tab Mahasiswa atau daftar akun Tenant baru.'
          : 'Akun ini Tenant. Pilih tab Tenant untuk masuk.',
      )
    }
    if (!p) throw new Error('Profil tidak ditemukan setelah login.')
  }, [])

  const register = useCallback(
    async (input: { email: string; password: string; name: string; role: UserRole }) => {
      const cred = await createUserWithEmailAndPassword(auth, input.email, input.password)
      await updateProfile(cred.user, { displayName: input.name })
      const prof: UserProfile = {
        role: input.role,
        name: input.name,
        email: input.email,
        ...(input.role === 'tenant' ? { tenantId: DEFAULT_TENANT_ID } : {}),
      }
      await writeUserProfile(cred.user.uid, prof)
    },
    [],
  )

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({ user, profile, loading, login, register, logout }),
    [user, profile, loading, login, register, logout],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
