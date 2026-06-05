import { Component, OnInit, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-gps-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div><h1>📍 GPS Tracking</h1><p>Real-time vehicle location tracking</p></div>
      <a routerLink="/transport" class="btn btn-secondary">← Back</a>
    </div>

    <div class="tracking-layout">
      <div class="vehicle-sidebar card">
        <h3>Vehicles</h3>
        <div class="vehicle-list">
          @for (v of vehicles(); track v.id) {
            <div class="vehicle-item" [class.active]="selectedVehicle()?.id === v.id" (click)="selectVehicle(v)">
              <span class="vehicle-status" [class.online]="v.online"></span>
              <div>
                <div class="vehicle-name">{{ v.number }}</div>
                <div class="vehicle-route-text">{{ v.route }}</div>
              </div>
              <span class="vehicle-speed" [class.moving]="v.speed > 0">{{ v.speed }} km/h</span>
            </div>
          }
        </div>
      </div>

      <div class="map-container card">
        <div id="trackingMap" class="map"></div>
        @if (selectedVehicle()) {
          <div class="vehicle-info-panel">
            <h4>🚌 {{ selectedVehicle()!.number }}</h4>
            <p>Route: {{ selectedVehicle()!.route }}</p>
            <p>Speed: {{ selectedVehicle()!.speed }} km/h</p>
            <p>Last Updated: {{ selectedVehicle()!.lastUpdate }}</p>
            <p>Driver: {{ selectedVehicle()!.driver }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .tracking-layout { display: grid; grid-template-columns: 300px 1fr; gap: var(--space-4); height: calc(100vh - 200px); }
    @media (max-width: 900px) { .tracking-layout { grid-template-columns: 1fr; height: auto; } }
    .vehicle-sidebar { overflow-y: auto; }
    .vehicle-sidebar h3 { margin-bottom: var(--space-4); }
    .vehicle-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .vehicle-item {
      display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md);
      cursor: pointer; transition: var(--transition-fast);
    }
    .vehicle-item:hover, .vehicle-item.active { background: var(--surface-hover); }
    .vehicle-status { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }
    .vehicle-status.online { background: #22c55e; }
    .vehicle-name { font-weight: 600; font-size: var(--text-sm); }
    .vehicle-route-text { font-size: var(--text-xs); color: var(--text-tertiary); }
    .vehicle-speed { margin-left: auto; font-size: var(--text-xs); font-weight: 600; color: var(--text-tertiary); }
    .vehicle-speed.moving { color: #22c55e; }
    .map-container { position: relative; min-height: 500px; padding: 0 !important; overflow: hidden; }
    .map { width: 100%; height: 100%; min-height: 500px; background: var(--surface-hover); }
    .vehicle-info-panel {
      position: absolute; bottom: var(--space-4); left: var(--space-4); background: var(--surface);
      border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4);
      box-shadow: var(--shadow-lg); min-width: 240px;
    }
    .vehicle-info-panel h4 { margin-bottom: var(--space-2); }
    .vehicle-info-panel p { font-size: var(--text-sm); color: var(--text-secondary); margin: var(--space-1) 0; }
  `]
})
export class GpsTrackingComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);

  selectedVehicle = signal<any>(null);
  vehicles = signal([
    { id: '1', number: 'BUS-001', route: 'Route A - North', speed: 35, online: true, lat: 28.6139, lng: 77.2090, driver: 'Rajesh Kumar', lastUpdate: '2 min ago' },
    { id: '2', number: 'BUS-002', route: 'Route B - South', speed: 0, online: false, lat: 28.5355, lng: 77.3910, driver: 'Amit Singh', lastUpdate: '15 min ago' },
    { id: '3', number: 'BUS-003', route: 'Route C - East', speed: 42, online: true, lat: 28.6279, lng: 77.2193, driver: 'Suresh Patel', lastUpdate: '1 min ago' },
    { id: '4', number: 'BUS-004', route: 'Route D - West', speed: 28, online: true, lat: 28.6508, lng: 77.2308, driver: 'Vikram Sharma', lastUpdate: '3 min ago' },
    { id: '5', number: 'VAN-001', route: 'Route E - Downtown', speed: 0, online: false, lat: 28.5921, lng: 77.2092, driver: 'Manoj Gupta', lastUpdate: '1 hour ago' },
  ]);

  private map: any;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  async initMap(): Promise<void> {
    try {
      const L = await import('leaflet');
      this.map = L.map('trackingMap').setView([28.6139, 77.2090], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(this.map);

      // Add markers for each vehicle
      for (const v of this.vehicles()) {
        const icon = L.divIcon({
          className: 'vehicle-marker',
          html: `<div style="background:${v.online ? '#22c55e' : '#ef4444'};color:white;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap">🚌 ${v.number}</div>`,
          iconSize: [100, 24],
          iconAnchor: [50, 12],
        });
        L.marker([v.lat, v.lng], { icon }).addTo(this.map).bindPopup(`<b>${v.number}</b><br>${v.route}<br>Speed: ${v.speed} km/h`);
      }
    } catch (e) {
      console.warn('Leaflet failed to load:', e);
    }
  }

  selectVehicle(v: any): void {
    this.selectedVehicle.set(v);
    if (this.map) {
      this.map.setView([v.lat, v.lng], 15);
    }
  }
}
