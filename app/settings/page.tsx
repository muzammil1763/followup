'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Save, X, Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Country {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

interface City {
  id: string;
  name: string;
  countryCode: string;
  active: boolean;
}

export default function SettingsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Country form
  const [showCountryForm, setShowCountryForm] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [countryForm, setCountryForm] = useState({ code: '', name: '', active: true });
  
  // City form
  const [showCityForm, setShowCityForm] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityForm, setCityForm] = useState({ name: '', countryCode: '', active: true });
  const [filterCountry, setFilterCountry] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [countriesRes, citiesRes] = await Promise.all([
        fetch('/api/countries'),
        fetch('/api/cities'),
      ]);
      const countriesData = await countriesRes.json();
      const citiesData = await citiesRes.json();
      setCountries(countriesData);
      setCities(citiesData);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Country handlers
  async function handleSaveCountry() {
    if (!countryForm.code || !countryForm.name) {
      toast.error('Code and name are required');
      return;
    }

    try {
      if (editingCountry) {
        const res = await fetch(`/api/countries/${editingCountry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(countryForm),
        });
        if (!res.ok) throw new Error();
        toast.success('Country updated');
      } else {
        const res = await fetch('/api/countries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(countryForm),
        });
        if (!res.ok) throw new Error();
        toast.success('Country created');
      }
      setShowCountryForm(false);
      setEditingCountry(null);
      setCountryForm({ code: '', name: '', active: true });
      fetchData();
    } catch {
      toast.error('Failed to save country');
    }
  }

  async function handleDeleteCountry(id: string) {
    if (!confirm('Delete this country? This will not delete associated cities.')) return;
    try {
      await fetch(`/api/countries/${id}`, { method: 'DELETE' });
      toast.success('Country deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete country');
    }
  }

  function startEditCountry(country: Country) {
    setEditingCountry(country);
    setCountryForm({ code: country.code, name: country.name, active: country.active });
    setShowCountryForm(true);
  }

  // City handlers
  async function handleSaveCity() {
    if (!cityForm.name || !cityForm.countryCode) {
      toast.error('Name and country are required');
      return;
    }

    try {
      if (editingCity) {
        const res = await fetch(`/api/cities/${editingCity.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cityForm),
        });
        if (!res.ok) throw new Error();
        toast.success('City updated');
      } else {
        const res = await fetch('/api/cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cityForm),
        });
        if (!res.ok) throw new Error();
        toast.success('City created');
      }
      setShowCityForm(false);
      setEditingCity(null);
      setCityForm({ name: '', countryCode: '', active: true });
      fetchData();
    } catch {
      toast.error('Failed to save city');
    }
  }

  async function handleDeleteCity(id: string) {
    if (!confirm('Delete this city?')) return;
    try {
      await fetch(`/api/cities/${id}`, { method: 'DELETE' });
      toast.success('City deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete city');
    }
  }

  function startEditCity(city: City) {
    setEditingCity(city);
    setCityForm({ name: city.name, countryCode: city.countryCode, active: city.active });
    setShowCityForm(true);
  }

  const filteredCities = filterCountry && filterCountry !== 'ALL'
    ? cities.filter((c) => c.countryCode === filterCountry)
    : cities;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage countries and cities</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Countries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Countries
                </CardTitle>
                <CardDescription>Manage available countries</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCountry(null);
                  setCountryForm({ code: '', name: '', active: true });
                  setShowCountryForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showCountryForm && (
              <Card className="mb-4 border-2 border-primary">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Code</Label>
                      <Input
                        placeholder="UAE"
                        value={countryForm.code}
                        onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input
                        placeholder="United Arab Emirates"
                        value={countryForm.name}
                        onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={countryForm.active}
                        onCheckedChange={(checked) => setCountryForm({ ...countryForm, active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveCountry} size="sm" className="flex-1">
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCountryForm(false);
                          setEditingCountry(null);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {countries.map((country) => (
                <div
                  key={country.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={country.active ? 'default' : 'secondary'}>
                      {country.code}
                    </Badge>
                    <span className="font-medium">{country.name}</span>
                    {!country.active && (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditCountry(country)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCountry(country.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {countries.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No countries yet. Add one to get started.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Cities
                </CardTitle>
                <CardDescription>Manage cities by country</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCity(null);
                  setCityForm({ name: '', countryCode: '', active: true });
                  setShowCityForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showCityForm && (
              <Card className="mb-4 border-2 border-primary">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label>City Name</Label>
                      <Input
                        placeholder="Dubai"
                        value={cityForm.name}
                        onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Select
                        value={cityForm.countryCode}
                        onValueChange={(val) => setCityForm({ ...cityForm, countryCode: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.id} value={c.code}>
                              {c.name} ({c.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cityForm.active}
                        onCheckedChange={(checked) => setCityForm({ ...cityForm, active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveCity} size="sm" className="flex-1">
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCityForm(false);
                          setEditingCity(null);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mb-4">
              <Label>Filter by Country</Label>
              <Select value={filterCountry || 'ALL'} onValueChange={(val) => setFilterCountry(val === 'ALL' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All countries</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[500px] space-y-2 overflow-y-auto">
              {filteredCities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{city.countryCode}</Badge>
                    <span className="font-medium">{city.name}</span>
                    {!city.active && (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditCity(city)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCity(city.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredCities.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No cities found. Add one to get started.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
