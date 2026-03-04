import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { FeeStructure, BillingCycle, SplitOption, FeeComponentDef, ClassModel, AcademicYear } from '../../core/models';

@Component({
  selector: 'app-fee-structure',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Fee Structure Management</h1>
        <p>Define fee templates for classes and sections</p>
      </div>
      <button class="btn btn-primary" (click)="openCreateModal()">+ Create Fee Structure</button>
    </div>

    <!-- Filters -->
    <div class="card filter-card">
      <div class="filters">
        <select class="form-select" [(ngModel)]="filterAcademicYear" (change)="load()">
          <option value="">All Academic Years</option>
          @for (ay of academicYearsList; track $index) {
            <option [value]="ay._id">{{ ay.name }}</option>
          }
        </select>
        <select class="form-select" [(ngModel)]="filterClass" (change)="load()">
          <option value="">All Classes</option>
          @for (cls of classesList; track $index) {
            <option [value]="cls._id">{{ cls.name }}</option>
          }
        </select>
      </div>
    </div>

    <!-- Fee Structures List -->
    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:80px;margin-bottom:12px"></div> }
      } @else {
        @if (structures().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No Fee Structures Found</h3>
            <p>Create your first fee structure to start collecting fees</p>
            <button class="btn btn-primary" (click)="openCreateModal()">Create Fee Structure</button>
          </div>
        } @else {
          <div class="structure-grid">
            @for (structure of structures(); track structure._id) {
              <div class="structure-card" [class.inactive]="!structure.isActive">
                <div class="structure-header">
                  <h3>{{ structure.name }}</h3>
                  <span class="badge" [class.badge-success]="structure.isActive" [class.badge-secondary]="!structure.isActive">
                    {{ structure.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="structure-meta">
                  <span>📚 {{ getClassName(structure.class) }}{{ structure.section ? ' - ' + structure.section : '' }}</span>
                  <span>📅 {{ getAcademicYearName(structure.academicYear) }}</span>
                </div>
                <div class="structure-details">
                  <div class="detail-row">
                    <span class="label">Billing Cycle:</span>
                    <span class="value">{{ formatBillingCycle(structure.billingCycle) }}</span>
                  </div>
                  @if (structure.billingCycle === 'yearly' && structure.splitOption !== 'no_split') {
                    <div class="detail-row">
                      <span class="label">Split Into:</span>
                      <span class="value">{{ formatSplitOption(structure.splitOption) }}</span>
                    </div>
                  }
                  <div class="detail-row">
                    <span class="label">Total Amount:</span>
                    <span class="value amount">{{ structure.totalAmount | currency:'INR' }}</span>
                  </div>
                </div>
                <div class="components-preview">
                  <strong>Components:</strong>
                  <ul>
                    @for (comp of structure.components.slice(0, 3); track comp.name) {
                      <li>{{ comp.name }}: {{ comp.amount | currency:'INR' }}</li>
                    }
                    @if (structure.components.length > 3) {
                      <li class="more">+{{ structure.components.length - 3 }} more</li>
                    }
                  </ul>
                </div>
                <div class="structure-actions">
                  <button class="btn btn-secondary btn-sm" (click)="editStructure(structure)">Edit</button>
                  <button class="btn btn-primary btn-sm" (click)="openGenerateModal(structure)">Generate Fees</button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- Create/Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-content card modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingStructure() ? 'Edit' : 'Create' }} Fee Structure</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          
          <!-- Prerequisites Check -->
          @if (academicYearsError() || classesError()) {
            <div class="error-panel">
              <strong>⚠️ Error Loading Data</strong>
              @if (academicYearsError()) {
                <p>Academic Years: {{ academicYearsError() }}</p>
              }
              @if (classesError()) {
                <p>Classes: {{ classesError() }}</p>
              }
              <button type="button" class="btn btn-secondary btn-sm" (click)="reloadDropdownData()">
                🔄 Retry
              </button>
            </div>
          } @else if (academicYearsList.length === 0 || classesList.length === 0) {
            <div class="prereq-warning">
              <strong>⚠️ Required Setup Missing</strong>
              <p>Before creating a fee structure, you need to set up:</p>
              <ul>
                @if (academicYearsList.length === 0 && !loadingAcademicYears()) {
                  <li>
                    <a routerLink="/academic-years" (click)="closeModal()">Create Academic Year</a> - 
                    No academic years found in your school
                  </li>
                }
                @if (classesList.length === 0 && !loadingClasses()) {
                  <li>
                    <a routerLink="/classes/new" (click)="closeModal()">Create Classes</a> - 
                    No classes found in your school
                  </li>
                }
              </ul>
              @if (loadingAcademicYears() || loadingClasses()) {
                <p class="loading-msg">Loading data...</p>
              }
              @if (!loadingAcademicYears() && !loadingClasses()) {
                <button type="button" class="btn btn-secondary btn-sm" (click)="reloadDropdownData()">
                  🔄 Refresh Data
                </button>
              }
            </div>
          }
          
          <form (ngSubmit)="saveStructure()">
            <div class="form-grid">
              <div class="form-group">
                <label>Name *</label>
                <input type="text" class="form-input" [(ngModel)]="form.name" name="name" 
                       placeholder="e.g., Standard Fee 2025-26" required />
              </div>
              
              <div class="form-group">
                <label>Academic Year *</label>
                <select class="form-select" [(ngModel)]="form.academicYear" name="academicYear" required>
                  <option value="">Select Academic Year</option>
                  <ng-container *ngFor="let ay of academicYearsList">
                    <option [value]="ay._id">{{ ay.name }}</option>
                  </ng-container>
                </select>
              </div>
              
              <div class="form-group">
                <label>Class *</label>
                <select class="form-select" [(ngModel)]="form.class" name="class" required (change)="onClassChange()">
                  <option value="">Select Class</option>
                  <ng-container *ngFor="let cls of classesList">
                    <option [value]="cls._id">{{ cls.name }}</option>
                  </ng-container>
                </select>
              </div>
              
              <div class="form-group">
                <label>Section (Optional)</label>
                <select class="form-select" [(ngModel)]="form.section" name="section">
                  <option value="">All Sections</option>
                  <option *ngFor="let sec of sectionsList" [value]="sec">{{ sec }}</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Billing Cycle *</label>
                <select class="form-select" [(ngModel)]="form.billingCycle" name="billingCycle" required>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly (Every 3 months)</option>
                  <option value="half_yearly">Half Yearly (Every 6 months)</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              @if (form.billingCycle === 'yearly') {
                <div class="form-group">
                  <label>Split Payment Option</label>
                  <select class="form-select" [(ngModel)]="form.splitOption" name="splitOption">
                    <option value="no_split">No Split (Full Payment)</option>
                    <option value="monthly">Monthly (12 payments)</option>
                    <option value="quarterly">Quarterly (4 payments)</option>
                    <option value="half_yearly">Half Yearly (2 payments)</option>
                  </select>
                </div>
              }
              
              <div class="form-group">
                <label>Due Day of Month</label>
                <input type="number" class="form-input" [(ngModel)]="form.dueDay" name="dueDay" 
                       min="1" max="28" placeholder="10" />
              </div>
              
              <div class="form-group">
                <label>Late Fee Penalty (%)</label>
                <input type="number" class="form-input" [(ngModel)]="form.lateFeePenalty" name="lateFeePenalty" 
                       min="0" max="100" placeholder="0" />
              </div>
            </div>
            
            <!-- Fee Components -->
            <div class="components-section">
              <div class="section-header">
                <h3>Fee Components</h3>
                <button type="button" class="btn btn-secondary btn-sm" (click)="addComponent()">+ Add Component</button>
              </div>
              
              @for (comp of form.components; track $index) {
                <div class="component-row">
                  <input type="text" class="form-input" [(ngModel)]="comp.name" [name]="'compName'+$index" 
                         placeholder="Component Name (e.g., Tuition Fee)" required />
                  <input type="number" class="form-input amount-input" [(ngModel)]="comp.amount" [name]="'compAmount'+$index" 
                         placeholder="Amount" min="0" required />
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="comp.isOptional" [name]="'compOptional'+$index" />
                    Optional
                  </label>
                  <button type="button" class="btn-icon danger" (click)="removeComponent($index)" [disabled]="form.components.length === 1">🗑</button>
                </div>
              }
              
              <div class="total-row">
                <span>Total Amount:</span>
                <strong>{{ calculateTotal() | currency:'INR' }}</strong>
              </div>
            </div>
            
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-input" [(ngModel)]="form.description" name="description" 
                        placeholder="Optional description" rows="2"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { <span class="spinner"></span> }
                {{ editingStructure() ? 'Update' : 'Create' }} Structure
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Generate Fees Modal -->
    @if (showGenerateModal()) {
      <div class="modal-backdrop" (click)="closeGenerateModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Generate Fees</h2>
            <button class="close-btn" (click)="closeGenerateModal()">×</button>
          </div>
          
          <div class="generate-info">
            <p><strong>Structure:</strong> {{ selectedStructure()?.name }}</p>
            <p><strong>Amount:</strong> {{ selectedStructure()?.totalAmount | currency:'INR' }}</p>
          </div>
          
          <form (ngSubmit)="generateFees()">
            <div class="form-group">
              <label>Period Type *</label>
              <select class="form-select" [(ngModel)]="generateForm.periodType" name="periodType" required (change)="updatePeriodOptions()">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="generateForm.generateAllPeriods" name="generateAllPeriods" />
                <span>Generate all periods for the year</span>
              </label>
              <p class="help-text">{{ getGenerateAllDescription() }}</p>
            </div>
            
            @if (!generateForm.generateAllPeriods) {
              <div class="form-group">
                <label>Period *</label>
                <select class="form-select" [(ngModel)]="generateForm.periodNumber" name="periodNumber" required>
                  @for (opt of periodOptions(); track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </div>
            }
            
            <div class="form-group">
              <label>Year *</label>
              <input type="number" class="form-input" [(ngModel)]="generateForm.year" name="year" 
                     [min]="currentYear - 1" [max]="currentYear + 1" required />
            </div>
            
            <div class="form-group">
              <label>Remarks</label>
              <input type="text" class="form-input" [(ngModel)]="generateForm.remarks" name="remarks" 
                     placeholder="Optional remarks" />
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeGenerateModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="generating()">
                @if (generating()) { <span class="spinner"></span> }
                Generate Fees
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .filter-card { padding: var(--space-4); margin-bottom: var(--space-4); }
    .filters { display: flex; gap: var(--space-4); flex-wrap: wrap; }
    .filters select { width: 200px; }
    
    .empty-state { text-align: center; padding: var(--space-12); }
    .empty-icon { font-size: 4rem; margin-bottom: var(--space-4); }
    .empty-state h3 { margin-bottom: var(--space-2); }
    .empty-state p { color: var(--text-secondary); margin-bottom: var(--space-4); }
    
    .structure-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: var(--space-4); }
    .structure-card { border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--space-4); }
    .structure-card.inactive { opacity: 0.7; }
    .structure-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
    .structure-header h3 { margin: 0; font-size: var(--text-lg); }
    .structure-meta { display: flex; gap: var(--space-4); font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-3); }
    .structure-details { background: var(--bg-surface); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-3); }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: var(--space-1); }
    .detail-row .label { color: var(--text-secondary); }
    .detail-row .amount { font-weight: 600; color: var(--color-primary); }
    .components-preview { font-size: var(--text-sm); margin-bottom: var(--space-3); }
    .components-preview ul { margin: var(--space-2) 0 0 var(--space-4); padding: 0; }
    .components-preview li { margin-bottom: 2px; }
    .components-preview .more { color: var(--text-secondary); }
    .structure-actions { display: flex; gap: var(--space-2); }
    
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; overflow-y: auto; padding: var(--space-4); }
    .modal-content { width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
    .modal-lg { max-width: 800px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-color); }
    .modal-header h2 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); }
    
    .prereq-warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
    .prereq-warning strong { color: #856404; }
    .prereq-warning p { margin: var(--space-2) 0; color: #856404; }
    .prereq-warning ul { margin: var(--space-2) 0 0 var(--space-4); padding: 0; }
    .prereq-warning li { margin-bottom: var(--space-2); color: #856404; }
    .prereq-warning a { color: var(--color-primary); font-weight: 600; text-decoration: underline; }
    .prereq-warning .loading-msg { font-style: italic; }
    
    .error-panel { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
    .error-panel strong { color: #721c24; }
    .error-panel p { margin: var(--space-2) 0; color: #721c24; }
    
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); margin-bottom: var(--space-4); }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
    
    .components-section { background: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
    .section-header h3 { margin: 0; }
    .component-row { display: flex; gap: var(--space-3); align-items: center; margin-bottom: var(--space-3); }
    .component-row input[type="text"] { flex: 2; }
    .amount-input { flex: 1 !important; max-width: 120px; }
    .checkbox-label { display: flex; align-items: center; gap: var(--space-1); font-size: var(--text-sm); white-space: nowrap; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: var(--space-2); border-radius: var(--radius-md); }
    .btn-icon.danger:hover { background: rgba(239,68,68,0.1); }
    .btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }
    .total-row { display: flex; justify-content: flex-end; gap: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border-color); font-size: var(--text-lg); }
    
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }
    
    .generate-info { background: var(--bg-surface); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-4); }
    .generate-info p { margin: var(--space-1) 0; }
    
    .checkbox-group { margin-bottom: var(--space-4); }
    .checkbox-group .checkbox-label { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; }
    .checkbox-group input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
    .checkbox-group .help-text { margin: var(--space-2) 0 0 26px; font-size: var(--text-sm); color: var(--text-secondary); }
    
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class FeeStructureComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  generating = signal(false);
  loadingAcademicYears = signal(false);
  loadingClasses = signal(false);
  academicYearsError = signal<string | null>(null);
  classesError = signal<string | null>(null);
  
  structures = signal<FeeStructure[]>([]);
  
  // Using plain arrays instead of signals for dropdown data
  academicYearsList: AcademicYear[] = [];
  classesList: ClassModel[] = [];
  sectionsList: string[] = [];
  
  filterAcademicYear = '';
  filterClass = '';
  
  showModal = signal(false);
  editingStructure = signal<FeeStructure | null>(null);
  
  form: any = this.getEmptyForm();
  
  showGenerateModal = signal(false);
  selectedStructure = signal<FeeStructure | null>(null);
  generateForm = { periodType: 'monthly', periodNumber: 1, year: new Date().getFullYear(), remarks: '', generateAllPeriods: true };
  periodOptions = signal<{value: number, label: string}[]>([]);
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    // Load academic years
    this.loadingAcademicYears.set(true);
    this.academicYearsError.set(null);
    this.api.get<any>('/academic-years').subscribe({
      next: (res) => {
        let data = res?.data?.items || res?.data?.data || res?.data || [];
        if (!Array.isArray(data)) {
          data = [];
        }
        this.academicYearsList = [...data];
        this.loadingAcademicYears.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.academicYearsError.set(err?.error?.message || err?.message || 'Failed to load academic years');
        this.toast.error('Failed to load academic years');
        this.loadingAcademicYears.set(false);
      },
    });
    
    // Load classes
    this.loadingClasses.set(true);
    this.classesError.set(null);
    this.api.get<any>('/classes', { limit: 100 }).subscribe({
      next: (res) => {
        let data = res?.data?.items || res?.data?.data || res?.data || [];
        if (!Array.isArray(data)) {
          data = [];
        }
        this.classesList = [...data];
        this.loadingClasses.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.classesError.set(err?.error?.message || err?.message || 'Failed to load classes');
        this.toast.error('Failed to load classes');
        this.loadingClasses.set(false);
      },
    });
    
    this.load();
  }

  reloadDropdownData(): void {
    this.loadInitialData();
  }

  load(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.filterAcademicYear) params.academicYear = this.filterAcademicYear;
    if (this.filterClass) params.classId = this.filterClass;
    
    this.api.get<any>('/fees/structures', params).subscribe({
      next: (res) => {
        let data = res?.data?.items || res?.data?.data || res?.data || [];
        if (!Array.isArray(data)) {
          data = [];
        }
        this.structures.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getEmptyForm(): any {
    return {
      name: '',
      academicYear: '',
      class: '',
      section: '',
      billingCycle: 'quarterly',
      splitOption: 'no_split',
      dueDay: 10,
      lateFeePenalty: 0,
      components: [{ name: 'Tuition Fee', amount: 0, isOptional: false }],
      description: '',
    };
  }

  openCreateModal(): void {
    this.form = this.getEmptyForm();
    this.editingStructure.set(null);
    this.showModal.set(true);
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  editStructure(structure: FeeStructure): void {
    this.editingStructure.set(structure);
    this.form = {
      name: structure.name,
      academicYear: typeof structure.academicYear === 'object' ? structure.academicYear._id : structure.academicYear,
      class: typeof structure.class === 'object' ? structure.class._id : structure.class,
      section: structure.section || '',
      billingCycle: structure.billingCycle,
      splitOption: structure.splitOption || 'no_split',
      dueDay: structure.dueDays?.[0] || 10,
      lateFeePenalty: structure.lateFeePenalty || 0,
      components: [...structure.components],
      description: structure.description || '',
    };
    this.onClassChange();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingStructure.set(null);
  }

  onClassChange(): void {
    const cls = this.classesList.find(c => c._id === this.form.class);
    if (cls && (cls as any).sections) {
      this.sectionsList = (cls as any).sections.map((s: any) => s.name || s);
    } else {
      this.sectionsList = [];
    }
  }

  addComponent(): void {
    this.form.components.push({ name: '', amount: 0, isOptional: false });
  }

  removeComponent(index: number): void {
    if (this.form.components.length > 1) {
      this.form.components.splice(index, 1);
    }
  }

  calculateTotal(): number {
    return this.form.components.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  }

  saveStructure(): void {
    if (!this.form.name || !this.form.academicYear || !this.form.class) {
      this.toast.error('Please fill all required fields');
      return;
    }
    
    this.saving.set(true);
    const payload = {
      name: this.form.name,
      academicYear: this.form.academicYear,
      class: this.form.class,
      section: this.form.section || undefined,
      billingCycle: this.form.billingCycle,
      splitOption: this.form.billingCycle === 'yearly' ? this.form.splitOption : 'no_split',
      dueDays: [this.form.dueDay || 10],
      lateFeePenalty: this.form.lateFeePenalty || 0,
      components: this.form.components,
      description: this.form.description,
    };
    
    const request = this.editingStructure()
      ? this.api.patch(`/fees/structures/${this.editingStructure()!._id}`, payload)
      : this.api.post('/fees/structures', payload);
    
    request.subscribe({
      next: () => {
        this.toast.success(this.editingStructure() ? 'Structure updated' : 'Structure created');
        this.closeModal();
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message || 'Failed to save structure');
      },
    });
  }

  openGenerateModal(structure: FeeStructure): void {
    this.selectedStructure.set(structure);
    this.generateForm = { 
      periodType: structure.billingCycle === 'yearly' ? 'yearly' : structure.billingCycle, 
      periodNumber: 1, 
      year: this.currentYear, 
      remarks: '',
      generateAllPeriods: true,
    };
    this.updatePeriodOptions();
    this.showGenerateModal.set(true);
  }

  closeGenerateModal(): void {
    this.showGenerateModal.set(false);
    this.selectedStructure.set(null);
  }

  updatePeriodOptions(): void {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    switch (this.generateForm.periodType) {
      case 'monthly':
        this.periodOptions.set(months.map((m, i) => ({ value: i + 1, label: m })));
        break;
      case 'quarterly':
        this.periodOptions.set([
          { value: 1, label: 'Q1 (Jan-Mar)' },
          { value: 2, label: 'Q2 (Apr-Jun)' },
          { value: 3, label: 'Q3 (Jul-Sep)' },
          { value: 4, label: 'Q4 (Oct-Dec)' },
        ]);
        break;
      case 'half_yearly':
        this.periodOptions.set([
          { value: 1, label: 'H1 (Jan-Jun)' },
          { value: 2, label: 'H2 (Jul-Dec)' },
        ]);
        break;
      case 'yearly':
        this.periodOptions.set([{ value: 1, label: 'Full Year' }]);
        break;
    }
    this.generateForm.periodNumber = 1;
  }

  generateFees(): void {
    const structure = this.selectedStructure();
    if (!structure) return;
    
    this.generating.set(true);
    
    if (this.generateForm.generateAllPeriods) {
      // Generate all periods for the year
      this.api.post('/fees/generate-from-structure', {
        feeStructureId: structure._id,
        periodType: this.generateForm.periodType,
        year: this.generateForm.year,
        remarks: this.generateForm.remarks,
        generateAllPeriods: true,
      }).subscribe({
        next: (res: any) => {
          this.generating.set(false);
          const data = res.data || res;
          this.toast.success(`Generated ${data.success || data.totalSuccess || 0} fees for all periods`);
          this.closeGenerateModal();
        },
        error: (err) => {
          this.generating.set(false);
          this.toast.error(err?.error?.message || 'Failed to generate fees');
        },
      });
    } else {
      // Generate single period
      this.api.post('/fees/generate-from-structure', {
        feeStructureId: structure._id,
        periodType: this.generateForm.periodType,
        periodNumber: this.generateForm.periodNumber,
        year: this.generateForm.year,
        remarks: this.generateForm.remarks,
      }).subscribe({
        next: (res: any) => {
          this.generating.set(false);
          const data = res.data || res;
          this.toast.success(`Generated ${data.success} fees (${data.failed} failed)`);
          this.closeGenerateModal();
        },
        error: (err) => {
          this.generating.set(false);
          this.toast.error(err?.error?.message || 'Failed to generate fees');
        },
      });
    }
  }

  getGenerateAllDescription(): string {
    const periodCount = this.getPeriodsCount();
    switch (this.generateForm.periodType) {
      case 'monthly': return `Will generate 12 monthly fee records (Jan-Dec ${this.generateForm.year})`;
      case 'quarterly': return `Will generate 4 quarterly fee records (Q1-Q4 ${this.generateForm.year})`;
      case 'half_yearly': return `Will generate 2 half-yearly fee records (H1, H2 ${this.generateForm.year})`;
      case 'yearly': return `Will generate 1 yearly fee record for ${this.generateForm.year}`;
      default: return '';
    }
  }

  getPeriodsCount(): number {
    switch (this.generateForm.periodType) {
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'half_yearly': return 2;
      case 'yearly': return 1;
      default: return 1;
    }
  }

  getClassName(cls: string | ClassModel): string {
    if (typeof cls === 'object') return cls.name;
    const found = this.classesList.find(c => c._id === cls);
    return found?.name || cls;
  }

  getAcademicYearName(ay: string | AcademicYear): string {
    if (typeof ay === 'object') return ay.name;
    const found = this.academicYearsList.find(a => a._id === ay);
    return found?.name || ay;
  }

  formatBillingCycle(cycle: string): string {
    switch (cycle) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly (3 months)';
      case 'half_yearly': return 'Half Yearly (6 months)';
      case 'yearly': return 'Yearly';
      default: return cycle;
    }
  }

  formatSplitOption(option?: string): string {
    switch (option) {
      case 'monthly': return '12 Monthly Payments';
      case 'quarterly': return '4 Quarterly Payments';
      case 'half_yearly': return '2 Half-Yearly Payments';
      default: return 'Full Payment';
    }
  }
}
