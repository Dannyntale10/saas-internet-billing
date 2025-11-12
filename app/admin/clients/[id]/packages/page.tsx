'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/logo'

interface Package {
  id: string
  name: string
  duration: number
  price: number
  currency: string
  isActive: boolean
}

interface ClientPackage {
  id: string
  packageId: string
  isActive: boolean
  package: Package
}

interface Client {
  id: string
  name: string
  packages: ClientPackage[]
}

export default function ClientPackagesPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [allPackages, setAllPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchData()
  }, [clientId, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      
      // Fetch client
      const clientRes = await fetch(`/api/admin/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      // Fetch all packages
      const packagesRes = await fetch('/api/admin/packages', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (clientRes.ok && packagesRes.ok) {
        const clientData = await clientRes.json()
        const packagesData = await packagesRes.json()
        setClient(clientData)
        setAllPackages(packagesData.filter((p: Package) => p.isActive))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignPackage = async (packageId: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/clients/${clientId}/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId }),
      })

      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        return
      }

      if (res.ok) {
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to assign package')
      }
    } catch (error) {
      console.error('Error assigning package:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleRemovePackage = async (clientPackageId: string) => {
    if (!confirm('Are you sure you want to remove this package from the client?')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/clients/${clientId}/packages/${clientPackageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        return
      }

      if (res.ok) {
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to remove package')
      }
    } catch (error) {
      console.error('Error removing package:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleToggleActive = async (clientPackageId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/clients/${clientId}/packages/${clientPackageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        return
      }

      if (res.ok) {
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update package')
      }
    } catch (error) {
      console.error('Error updating package:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const assignedPackageIds = client?.packages.map((cp) => cp.packageId) || []
  const availablePackages = allPackages.filter((p) => !assignedPackageIds.includes(p.id))

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Logo />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">
              Manage Packages: {client?.name}
            </h1>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Packages */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Packages ({client?.packages.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {client?.packages.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No packages assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {client?.packages.map((cp) => (
                    <div
                      key={cp.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-background-light p-4 rounded-button"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{cp.package.name}</p>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              cp.isActive
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {cp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {cp.package.duration} hours - {cp.package.currency} {cp.package.price}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(cp.id, cp.isActive)}
                          className="w-full sm:w-auto"
                        >
                          {cp.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemovePackage(cp.id)}
                          className="w-full sm:w-auto text-red-400 border-red-400/50 hover:bg-red-500/20"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Packages */}
          <Card>
            <CardHeader>
              <CardTitle>Available Packages ({availablePackages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {availablePackages.length === 0 ? (
                <p className="text-gray-400 text-center py-8">All packages are assigned.</p>
              ) : (
                <div className="space-y-2">
                  {availablePackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-background-light p-4 rounded-button"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{pkg.name}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {pkg.duration} hours - {pkg.currency} {pkg.price}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAssignPackage(pkg.id)}
                        className="w-full sm:w-auto"
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

