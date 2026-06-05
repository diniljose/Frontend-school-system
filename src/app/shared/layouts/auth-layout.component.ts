import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div class="auth-layout" [class.mobile-view]="isMobile()">
      <!-- Premium Immersive Brand Panel - Same on Desktop & Mobile -->
      <div class="auth-brand">
        <!-- Animated Mesh Gradient Background -->
        <div class="mesh-gradient-bg"></div>
        
        <!-- 3D Floating Shapes -->
        <div class="floating-shapes-3d">
          <div class="shape-3d cube" [style.transform]="get3DParallax(0.8)"></div>
          <div class="shape-3d sphere" [style.transform]="get3DParallax(1.2)"></div>
          <div class="shape-3d torus" [style.transform]="get3DParallax(0.6)"></div>
          <div class="shape-3d pyramid" [style.transform]="get3DParallax(1.0)"></div>
        </div>
        
        <!-- Floating Blobs -->
        <div class="floating-blobs">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
          <div class="blob blob-3"></div>
          <div class="blob blob-4"></div>
        </div>
        
        <!-- Light Beams -->
        <div class="light-beams">
          <div class="beam beam-1"></div>
          <div class="beam beam-2"></div>
          <div class="beam beam-3"></div>
        </div>
        
        <!-- Animated SVG Particle Icons -->
        <div class="particle-field">
          <div class="particle-icon" style="top: 10%; left: 15%; --delay: 0s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div class="particle-icon" style="top: 20%; right: 20%; --delay: 2s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div class="particle-icon" style="top: 45%; left: 8%; --delay: 4s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div class="particle-icon" style="top: 70%; right: 12%; --delay: 1s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div class="particle-icon" style="top: 60%; left: 25%; --delay: 3s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="particle-icon" style="top: 30%; right: 30%; --delay: 5s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div class="particle-icon" style="top: 80%; left: 35%; --delay: 2.5s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="particle-icon" style="top: 15%; right: 40%; --delay: 3.5s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
        </div>
        
        <!-- Floating Education Module Cards -->
        <div class="floating-modules" 
             [style.--mouse-x]="mouseX() + 'px'" 
             [style.--mouse-y]="mouseY() + 'px'">
          <!-- Students Card -->
          <div class="floating-card glassmorphism" 
               style="top: 12%; left: 8%; --delay: 0s; --duration: 7s; --initial-rotate: -3deg;"
               [style.transform]="getParallaxTransform(1.2)">
            <div class="card-icon students">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Students</span>
              <span class="card-value">2,847</span>
            </div>
            <span class="card-trend up">+12%</span>
          </div>
          
          <!-- Teachers Card -->
          <div class="floating-card glassmorphism" 
               style="top: 8%; right: 12%; --delay: 1s; --duration: 8s; --initial-rotate: 2deg;"
               [style.transform]="getParallaxTransform(0.8)">
            <div class="card-icon teachers">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Teachers</span>
              <span class="card-value">186</span>
            </div>
            <span class="card-trend up">+5%</span>
          </div>
          
          <!-- Attendance Card -->
          <div class="floating-card glassmorphism" 
               style="top: 35%; left: 5%; --delay: 2s; --duration: 9s; --initial-rotate: -2deg;"
               [style.transform]="getParallaxTransform(1.5)">
            <div class="card-icon attendance">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Attendance</span>
              <span class="card-value">94.2%</span>
            </div>
            <span class="card-trend up">+2.1%</span>
          </div>
          
          <!-- Exams Card -->
          <div class="floating-card glassmorphism" 
               style="top: 32%; right: 8%; --delay: 0.5s; --duration: 7.5s; --initial-rotate: 3deg;"
               [style.transform]="getParallaxTransform(1.1)">
            <div class="card-icon exams">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Exams</span>
              <span class="card-value">24 Active</span>
            </div>
          </div>
          
          <!-- Fees Card -->
          <div class="floating-card glassmorphism" 
               style="top: 58%; left: 10%; --delay: 1.5s; --duration: 8.5s; --initial-rotate: -1deg;"
               [style.transform]="getParallaxTransform(0.9)">
            <div class="card-icon fees">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Fee Collection</span>
              <span class="card-value">$1.2M</span>
            </div>
            <span class="card-trend up">+18%</span>
          </div>
          
          <!-- Reports Card -->
          <div class="floating-card glassmorphism" 
               style="top: 55%; right: 5%; --delay: 2.5s; --duration: 7s; --initial-rotate: 2deg;"
               [style.transform]="getParallaxTransform(1.3)">
            <div class="card-icon reports">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Reports</span>
              <span class="card-value">156 Generated</span>
            </div>
          </div>
          
          <!-- Parents Card -->
          <div class="floating-card glassmorphism" 
               style="top: 78%; left: 15%; --delay: 0.8s; --duration: 9s; --initial-rotate: -2deg;"
               [style.transform]="getParallaxTransform(1.0)">
            <div class="card-icon parents">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Parents</span>
              <span class="card-value">4,521</span>
            </div>
            <span class="card-trend up">+8%</span>
          </div>
          
          <!-- Analytics Card -->
          <div class="floating-card glassmorphism" 
               style="top: 75%; right: 10%; --delay: 1.8s; --duration: 8s; --initial-rotate: 1deg;"
               [style.transform]="getParallaxTransform(0.7)">
            <div class="card-icon analytics">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">AI Insights</span>
              <span class="card-value">12 New</span>
            </div>
          </div>
        </div>
        
        <!-- 3D Device Mockup -->
        <div class="device-mockup-3d" [style.transform]="get3DParallax(0.4)">
          <div class="device-frame">
            <div class="device-screen">
              <div class="screen-content">
                <div class="screen-header">
                  <div class="screen-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <div class="screen-url">app.eduplatform.com/dashboard</div>
                </div>
                <div class="screen-dashboard">
                  <div class="dash-sidebar">
                    <div class="dash-nav-item active"></div>
                    <div class="dash-nav-item"></div>
                    <div class="dash-nav-item"></div>
                    <div class="dash-nav-item"></div>
                    <div class="dash-nav-item"></div>
                  </div>
                  <div class="dash-main">
                    <div class="dash-cards">
                      <div class="dash-card"></div>
                      <div class="dash-card"></div>
                      <div class="dash-card"></div>
                      <div class="dash-card"></div>
                    </div>
                    <div class="dash-chart"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="device-notch"></div>
          </div>
          <div class="device-reflection"></div>
        </div>
        
        <!-- Brand Content Overlay -->
        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="rgba(255,255,255,0.15)"/>
                <path d="M14 34V20l10-7 10 7v14" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 34v-8h8v8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="24" cy="16" r="2" fill="#fff" opacity="0.8"/>
              </svg>
            </div>
            <span class="logo-text">EduPlatform</span>
          </div>
          
          <h1 class="brand-headline">
            The Complete<br/>
            <span class="gradient-text">School Ecosystem</span>
          </h1>
          
          <p class="brand-description">
            Transform how you manage academics, students, staff, and operations with AI-powered insights.
          </p>
        </div>
        
        <!-- Footer Link -->
        <div class="brand-footer">
          <a routerLink="/guide" class="explore-link">
            <span>Explore Platform Features</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Form Area -->
      <div class="auth-form-area">
        <div class="form-container">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      min-height: 100vh;
      min-height: 100dvh;
      overflow: hidden;
    }
    
    .auth-layout.mobile-view {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       PREMIUM BRAND PANEL
    ═══════════════════════════════════════════════════════════════════════════════ */
    .auth-brand {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: var(--space-8);
      overflow: hidden;
      background: #0f0f23;
    }
    
    /* Mesh Gradient Background */
    .mesh-gradient-bg {
      position: absolute;
      inset: 0;
      background: radial-gradient(at 0% 0%, rgb(26 56 89) 0px, #262d5a 50%), radial-gradient(at 80% 0%, rgb(45 46 100) 0px, #282c5b 50%), radial-gradient(at 100% 50%, rgb(44 42 94) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(6, 182, 212, 0.25) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(168, 85, 247, 0.2) 0px, transparent 50%), linear-gradient(135deg, #2b3364 0%, #2e3068 50%, #193758 100%);
      // background: 
      //   radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.4) 0px, transparent 50%),
      //   radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.35) 0px, transparent 50%),
      //   radial-gradient(at 100% 50%, rgba(59, 130, 246, 0.3) 0px, transparent 50%),
      //   radial-gradient(at 0% 100%, rgba(6, 182, 212, 0.25) 0px, transparent 50%),
      //   radial-gradient(at 80% 100%, rgba(168, 85, 247, 0.2) 0px, transparent 50%),
      //   linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
      background-size: 200% 200%;
      animation: meshGradientShift 20s ease infinite;
    }
    
    @keyframes meshGradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    
    /* Floating Blobs */
    .floating-blobs {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.5;
      animation: floatBlob 25s ease-in-out infinite;
    }
    
    .blob-1 {
      width: 500px;
      height: 500px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.2));
      top: -150px;
      right: -100px;
      animation-delay: 0s;
    }
    
    .blob-2 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.2));
      bottom: -100px;
      left: -100px;
      animation-delay: -5s;
    }
    
    .blob-3 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.2));
      top: 40%;
      left: 30%;
      animation-delay: -10s;
    }
    
    .blob-4 {
      width: 250px;
      height: 250px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.15));
      bottom: 20%;
      right: 20%;
      animation-delay: -15s;
    }
    
    @keyframes floatBlob {
      0%, 100% {
        transform: translate(0, 0) scale(1) rotate(0deg);
      }
      25% {
        transform: translate(30px, -50px) scale(1.1) rotate(5deg);
      }
      50% {
        transform: translate(-20px, -25px) scale(0.95) rotate(-3deg);
      }
      75% {
        transform: translate(-30px, 20px) scale(1.05) rotate(3deg);
      }
    }
    
    /* Light Beams */
    .light-beams {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    
    .beam {
      position: absolute;
      width: 150%;
      height: 100px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent);
      transform: skewX(-15deg);
    }
    
    .beam-1 {
      top: 20%;
      left: -50%;
      animation: lightBeam 15s linear infinite;
    }
    
    .beam-2 {
      top: 60%;
      left: -50%;
      animation: lightBeam 20s linear infinite;
      animation-delay: -5s;
    }
    
    @keyframes lightBeam {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(100%) skewX(-15deg); }
    }
    
    /* Particle Field */
    .particle-field {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    
    .particle-icon {
      position: absolute;
      width: 32px;
      height: 32px;
      color: rgba(255, 255, 255, 0.35);
      animation: particleFloat var(--duration, 20s) ease-in-out infinite;
      animation-delay: var(--delay, 0s);
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
      transition: all 0.3s;
      
      svg {
        width: 100%;
        height: 100%;
      }
      
      &:hover {
        color: rgba(255, 255, 255, 0.6);
        transform: scale(1.2);
      }
    }
    
    .particle-icon:nth-child(1) { --duration: 22s; }
    .particle-icon:nth-child(2) { --duration: 25s; }
    .particle-icon:nth-child(3) { --duration: 20s; }
    .particle-icon:nth-child(4) { --duration: 28s; }
    .particle-icon:nth-child(5) { --duration: 23s; }
    .particle-icon:nth-child(6) { --duration: 21s; }
    .particle-icon:nth-child(7) { --duration: 26s; }
    .particle-icon:nth-child(8) { --duration: 24s; }
    
    @keyframes particleFloat {
      0%, 100% {
        transform: translateY(0) translateX(0) scale(1) rotate(0deg);
        opacity: 0.35;
      }
      25% {
        transform: translateY(-40px) translateX(15px) scale(1.1) rotate(5deg);
        opacity: 0.5;
      }
      50% {
        transform: translateY(-20px) translateX(-10px) scale(0.9) rotate(-3deg);
        opacity: 0.3;
      }
      75% {
        transform: translateY(-50px) translateX(-15px) scale(1.05) rotate(3deg);
        opacity: 0.45;
      }
    }
    
    /* 3D Floating Shapes */
    .floating-shapes-3d {
      position: absolute;
      inset: 0;
      perspective: 1000px;
      pointer-events: none;
    }
    
    .shape-3d {
      position: absolute;
      width: 80px;
      height: 80px;
      animation: float3D 15s ease-in-out infinite;
      transition: transform 0.2s ease-out;
    }
    
    .shape-3d.cube {
      top: 15%;
      left: 20%;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.2));
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      transform: rotateX(45deg) rotateY(45deg);
      animation-delay: 0s;
      box-shadow: 
        -5px 5px 15px rgba(99, 102, 241, 0.3),
        inset 0 0 20px rgba(255, 255, 255, 0.1);
    }
    
    .shape-3d.sphere {
      top: 60%;
      right: 15%;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle at 30% 30%, rgba(236, 72, 153, 0.4), rgba(168, 85, 247, 0.2));
      border-radius: 50%;
      animation-delay: -3s;
      box-shadow: 
        0 10px 30px rgba(168, 85, 247, 0.3),
        inset -10px -10px 30px rgba(0, 0, 0, 0.2),
        inset 10px 10px 30px rgba(255, 255, 255, 0.1);
    }
    
    .shape-3d.torus {
      top: 75%;
      left: 30%;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(59, 130, 246, 0.2));
      border-radius: 50%;
      border: 8px solid rgba(6, 182, 212, 0.3);
      animation-delay: -6s;
      box-shadow: 0 8px 25px rgba(6, 182, 212, 0.3);
    }
    
    .shape-3d.pyramid {
      top: 25%;
      right: 25%;
      width: 0;
      height: 0;
      border-left: 40px solid transparent;
      border-right: 40px solid transparent;
      border-bottom: 70px solid rgba(16, 185, 129, 0.3);
      background: transparent;
      animation-delay: -9s;
      filter: drop-shadow(0 10px 20px rgba(16, 185, 129, 0.3));
    }
    
    @keyframes float3D {
      0%, 100% {
        transform: translateY(0) rotateX(0deg) rotateY(0deg);
      }
      25% {
        transform: translateY(-20px) rotateX(10deg) rotateY(15deg);
      }
      50% {
        transform: translateY(-10px) rotateX(-5deg) rotateY(-10deg);
      }
      75% {
        transform: translateY(-30px) rotateX(8deg) rotateY(-5deg);
      }
    }
    
    /* Floating Module Cards */
    .floating-modules {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    
    .floating-card {
      position: absolute;
      padding: 14px 18px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 2px 8px rgba(0, 0, 0, 0.06);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: floatCard var(--duration, 8s) ease-in-out infinite;
      animation-delay: var(--delay, 0s);
      transform-origin: center;
      --rotate: var(--initial-rotate, 0deg);
      transition: transform 0.1s ease-out, box-shadow 0.3s;
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.3));
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
      }
      
      &.glassmorphism {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        
        &:hover {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.15),
            0 4px 12px rgba(0, 0, 0, 0.08);
        }
      }
    }
    
    @keyframes floatCard {
      0%, 100% {
        transform: translateY(0) rotate(var(--rotate, 0deg));
      }
      50% {
        transform: translateY(-12px) rotate(calc(var(--rotate, 0deg) + 1deg));
      }
    }
    
    .card-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #fff;
      
      svg {
        width: 22px;
        height: 22px;
      }
      
      &.students { background: linear-gradient(135deg, #10b981, #059669); }
      &.teachers { background: linear-gradient(135deg, #3b82f6, #2563eb); }
      &.attendance { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &.exams { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
      &.fees { background: linear-gradient(135deg, #06b6d4, #0891b2); }
      &.reports { background: linear-gradient(135deg, #ec4899, #db2777); }
      &.parents { background: linear-gradient(135deg, #f43f5e, #e11d48); }
      &.analytics { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    }
    
    .card-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .card-title {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        white-space: nowrap;
      }
      
      .card-value {
        font-size: 11px;
        color: #64748b;
        font-family: var(--font-mono);
      }
    }
    
    .card-trend {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
      
      &.up {
        background: rgba(16, 185, 129, 0.12);
        color: #059669;
      }
    }
    
    /* 3D Device Mockup */
    .device-mockup-3d {
      position: absolute;
      bottom: 5%;
      left: 50%;
      transform: translateX(-50%) perspective(1000px) rotateX(5deg) rotateY(-10deg);
      z-index: 5;
      transition: transform 0.2s ease-out;
      animation: deviceFloat 8s ease-in-out infinite;
    }
    
    @keyframes deviceFloat {
      0%, 100% { transform: translateX(-50%) translateY(0) perspective(1000px) rotateX(5deg) rotateY(-10deg); }
      50% { transform: translateX(-50%) translateY(-15px) perspective(1000px) rotateX(8deg) rotateY(-5deg); }
    }
    
    .device-frame {
      position: relative;
      width: 320px;
      height: 220px;
      background: linear-gradient(145deg, #2a2a3e, #1a1a2e);
      border-radius: 16px;
      padding: 8px;
      box-shadow: 
        0 30px 60px rgba(0, 0, 0, 0.4),
        0 10px 20px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    
    .device-screen {
      width: 100%;
      height: 100%;
      background: #0f172a;
      border-radius: 10px;
      overflow: hidden;
    }
    
    .screen-content {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .screen-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .screen-dots {
      display: flex;
      gap: 5px;
      
      span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        
        &:nth-child(1) { background: #ff5f57; }
        &:nth-child(2) { background: #ffbd2e; }
        &:nth-child(3) { background: #28c840; }
      }
    }
    
    .screen-url {
      flex: 1;
      text-align: center;
      font-size: 9px;
      color: rgba(255, 255, 255, 0.5);
      font-family: var(--font-mono);
    }
    
    .screen-dashboard {
      flex: 1;
      display: flex;
      padding: 8px;
      gap: 8px;
    }
    
    .dash-sidebar {
      width: 40px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px 6px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
    }
    
    .dash-nav-item {
      height: 20px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      
      &.active {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
      }
    }
    
    .dash-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .dash-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    
    .dash-card {
      height: 40px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      animation: cardPulse 3s ease-in-out infinite;
      
      &:nth-child(1) { animation-delay: 0s; background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1)); }
      &:nth-child(2) { animation-delay: 0.5s; background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1)); }
      &:nth-child(3) { animation-delay: 1s; background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(245, 158, 11, 0.1)); }
      &:nth-child(4) { animation-delay: 1.5s; background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1)); }
    }
    
    @keyframes cardPulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    
    .dash-chart {
      flex: 1;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60%;
        background: linear-gradient(to top, rgba(99, 102, 241, 0.2), transparent);
        clip-path: polygon(0 100%, 10% 60%, 20% 80%, 30% 40%, 40% 60%, 50% 30%, 60% 50%, 70% 20%, 80% 40%, 90% 10%, 100% 30%, 100% 100%);
      }
    }
    
    .device-notch {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 6px;
      background: #1a1a2e;
      border-radius: 0 0 8px 8px;
    }
    
    .device-reflection {
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%) scaleY(-0.3);
      width: 280px;
      height: 60px;
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), transparent);
      filter: blur(10px);
      opacity: 0.3;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }
    
    /* Brand Content */
    .brand-content {
      position: relative;
      z-index: 10;
      color: #fff;
      max-width: 500px;
      text-align: center;
      padding-bottom: 280px;
      
      .brand-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        margin-bottom: var(--space-6);
        
        .logo-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          animation: fadeInDown 0.8s ease-out both;
        }
        
        .logo-text {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          animation: fadeInDown 0.8s ease-out 0.1s both;
        }
      }
      
      .brand-headline {
        font-size: 3rem;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.03em;
        margin-bottom: var(--space-5);
        animation: fadeInDown 0.8s ease-out 0.2s both;
        
        .gradient-text {
          background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }
      
      .brand-description {
        font-size: 1.1rem;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.75);
        max-width: 420px;
        margin: 0 auto;
        animation: fadeInDown 0.8s ease-out 0.3s both;
      }
    }
    
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Brand Footer */
    .brand-footer {
      position: absolute;
      bottom: var(--space-6);
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      
      .explore-link {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: translateY(-2px);
          
          svg {
            transform: translateX(4px);
          }
        }
        
        svg {
          transition: transform 0.3s;
        }
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       FORM AREA
    ═══════════════════════════════════════════════════════════════════════════════ */
    .auth-form-area {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8);
background: linear-gradient(135deg, #373a73 0%, #2d3265 20%, #303672 40%, #e8dcf9 60%, #ddd4f5 80%, #e5dcff 100%);
      // background: var(--bg-body);
      overflow-y: auto;
     
    }
    
    .form-container {
      width: 100%;
      max-width: 480px;
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       RESPONSIVE STYLES - SAME LAYOUT ON ALL DEVICES
    ═══════════════════════════════════════════════════════════════════════════════ */
    
    @media (max-width: 1200px) {
      .floating-card {
        padding: 12px 14px;
        
        .card-icon {
          width: 36px;
          height: 36px;
        }
        
        .card-content .card-title {
          font-size: 12px;
        }
        
        .card-trend {
          font-size: 9px;
          padding: 2px 6px;
        }
      }
      
      .brand-content .brand-headline {
        font-size: 2.5rem;
      }
      
      .device-mockup-3d {
        transform: translateX(-50%) scale(0.85) perspective(1000px) rotateX(5deg) rotateY(-10deg);
      }
    }
    
    /* Tablet Layout */
    @media (max-width: 1024px) {
      .auth-layout {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
        overflow-y: auto;
      }
      
      .auth-brand {
        min-height: 80vh;
        padding: var(--space-6);
      }
      
      .floating-card {
        transform: scale(0.9);
        
        &:nth-child(1) { top: 8%; left: 5%; }
        &:nth-child(2) { top: 5%; right: 5%; }
        &:nth-child(3) { top: 28%; left: 3%; }
        &:nth-child(4) { top: 25%; right: 3%; }
        &:nth-child(5) { top: 48%; left: 5%; }
        &:nth-child(6) { top: 45%; right: 3%; }
        &:nth-child(7) { top: 68%; left: 8%; }
        &:nth-child(8) { top: 65%; right: 5%; }
      }
      
      .device-mockup-3d {
        bottom: 3%;
        transform: translateX(-50%) scale(0.75) perspective(1000px) rotateX(5deg) rotateY(-10deg);
      }
      
      .brand-content {
        .brand-headline {
          font-size: 2.2rem;
        }
        .brand-description {
          font-size: 15px;
        }
      }
      
      .auth-form-area {
        padding: var(--space-6);
        min-height: auto;
      }
    }
    
    /* Mobile Layout - CLEAN & PROFESSIONAL */
    @media (max-width: 768px) {
      .auth-layout {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
        min-height: auto;
      }
      
      .auth-brand {
        min-height: 50vh;
        padding: 48px 24px 40px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      
      /* Hide cluttering elements on mobile for clean look */
      .floating-shapes-3d,
      .floating-modules,
      .device-mockup-3d,
      .particle-field {
        display: none !important;
      }
      
      /* Keep subtle ambient effects */
      .floating-blobs {
        opacity: 0.4;
        
        .blob {
          transform: scale(0.6);
        }
      }
      
      .light-beams {
        opacity: 0.3;
      }
      
      /* Clean brand content for mobile */
      .brand-content {
        padding: 0;
        padding-bottom: 0;
        max-width: 100%;
        
        .brand-logo {
          margin-bottom: 24px;
          
          .logo-icon {
            width: 52px;
            height: 52px;
            border-radius: 14px;
            
            svg {
              width: 44px;
              height: 44px;
            }
          }
          
          .logo-text {
            font-size: 20px;
            font-weight: 800;
          }
        }
        
        .brand-headline {
          font-size: 2rem;
          line-height: 1.15;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
          
          br {
            display: none;
          }
        }
        
        .brand-description {
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
          max-width: 320px;
        }
      }
      
      .brand-footer {
        position: relative;
        bottom: auto;
        left: auto;
        transform: none;
        margin-top: 32px;
        
        .explore-link {
          font-size: 14px;
          padding: 12px 24px;
          border-radius: 12px;
        }
      }
      
      .auth-form-area {
        padding: 32px 24px 48px;
background: linear-gradient(135deg, #373a73 0%, #2d3265 20%, #303672 40%, #e8dcf9 60%, #ddd4f5 80%, #e5dcff 100%);
        // background: var(--bg-body);
      }
      
      .form-container {
        max-width: 100%;
      }
    }
    
    /* Small Mobile */
    @media (max-width: 380px) {
      .auth-brand {
        min-height: 45vh;
        padding: 36px 16px 32px;
      }
      
      .brand-content {
        .brand-logo {
          margin-bottom: 20px;
          
          .logo-icon {
            width: 46px;
            height: 46px;
          }
          
          .logo-text {
            font-size: 18px;
          }
        }
        
        .brand-headline {
          font-size: 1.65rem;
        }
        
        .brand-description {
          font-size: 14px;
        }
      }
      
      .brand-footer {
        margin-top: 24px;
        
        .explore-link {
          font-size: 13px;
          padding: 10px 20px;
        }
      }
      
      .auth-form-area {
        padding: 24px 16px 36px;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       REDUCED MOTION
    ═══════════════════════════════════════════════════════════════════════════════ */
    @media (prefers-reduced-motion: reduce) {
      .mesh-gradient-bg,
      .blob,
      .beam,
      .particle-icon,
      .floating-card,
      .device-mockup-3d,
      .live-indicator,
      .m3d-shape {
        animation: none !important;
      }
      
      .brand-logo .logo-icon,
      .brand-headline,
      .brand-description {
        animation: none !important;
        opacity: 1;
        transform: none;
      }
    }
  `]
})
export class AuthLayoutComponent {
  isMobile = signal(false);
  mouseX = signal(0);
  mouseY = signal(0);
  
  constructor() {
    this.checkMobile();
  }
  
  @HostListener('window:resize')
  checkMobile() {
    this.isMobile.set(window.innerWidth <= 1024);
  }
  
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // Only track on desktop
    if (!this.isMobile()) {
      this.mouseX.set(event.clientX);
      this.mouseY.set(event.clientY);
    }
  }
  
  getParallaxTransform(intensity: number): string {
    if (this.isMobile()) return '';
    
    const centerX = window.innerWidth / 4; // Brand panel is ~half width
    const centerY = window.innerHeight / 2;
    
    const deltaX = (this.mouseX() - centerX) / centerX;
    const deltaY = (this.mouseY() - centerY) / centerY;
    
    const moveX = deltaX * 15 * intensity;
    const moveY = deltaY * 10 * intensity;
    
    return `translate(${moveX}px, ${moveY}px)`;
  }
  
  get3DParallax(intensity: number): string {
    if (this.isMobile()) return '';
    
    const centerX = window.innerWidth / 4;
    const centerY = window.innerHeight / 2;
    
    const deltaX = (this.mouseX() - centerX) / centerX;
    const deltaY = (this.mouseY() - centerY) / centerY;
    
    const rotateY = deltaX * 5 * intensity;
    const rotateX = -deltaY * 5 * intensity;
    const translateZ = Math.abs(deltaX + deltaY) * 10 * intensity;
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
  }
  
  private touchStartX = 0;
  
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }
  
  onTouchEnd(event: TouchEvent): void {
    const touchEndX = event.changedTouches[0].clientX;
    const diff = this.touchStartX - touchEndX;
    
    // Detect swipe direction (threshold of 50px)
    if (Math.abs(diff) > 50) {
      const carousel = event.currentTarget as HTMLElement;
      const scrollAmount = diff > 0 ? 160 : -160; // Card width + gap
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
}
