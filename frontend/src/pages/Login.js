import { AuthService } from '../services/auth.js';

export class LoginPage {
  constructor(onLoginSuccess) {
    this.authService = new AuthService();
    this.onLoginSuccess = onLoginSuccess;
    this.isLoginMode = true;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'auth-container';

    const card = document.createElement('div');
    card.className = 'auth-card glow';

    const title = document.createElement('h1');
    title.className = 'auth-title pulse';
    title.textContent = '🎯 TheMind';

    const subtitle = document.createElement('p');
    subtitle.className = 'text-center mb-4';
    subtitle.textContent = 'Smart Attendance System';

    const form = document.createElement('form');
    form.onsubmit = (e) => this.handleSubmit(e);

    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.display = 'none';
    errorDiv.className = 'alert alert-error mb-3';

    // Name field (only for register)
    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';
    nameGroup.id = 'name-group';
    nameGroup.style.display = this.isLoginMode ? 'none' : 'block';

    const nameLabel = document.createElement('label');
    nameLabel.className = 'form-label';
    nameLabel.textContent = 'Full Name';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'form-input';
    nameInput.id = 'name-input';
    nameInput.placeholder = 'Enter your full name';

    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);

    // Email field
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';

    const emailLabel = document.createElement('label');
    emailLabel.className = 'form-label';
    emailLabel.textContent = 'Email';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.className = 'form-input';
    emailInput.id = 'email-input';
    emailInput.placeholder = 'Enter your email';
    emailInput.required = true;

    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);

    // Password field
    const passwordGroup = document.createElement('div');
    passwordGroup.className = 'form-group';

    const passwordLabel = document.createElement('label');
    passwordLabel.className = 'form-label';
    passwordLabel.textContent = 'Password';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.className = 'form-input';
    passwordInput.id = 'password-input';
    passwordInput.placeholder = 'Enter your password';
    passwordInput.required = true;

    passwordGroup.appendChild(passwordLabel);
    passwordGroup.appendChild(passwordInput);

    // Role selection (only for register)
    const roleGroup = document.createElement('div');
    roleGroup.className = 'form-group';
    roleGroup.id = 'role-group';
    roleGroup.style.display = this.isLoginMode ? 'none' : 'block';

    const roleLabel = document.createElement('label');
    roleLabel.className = 'form-label';
    roleLabel.textContent = 'I am a:';

    const roleButtons = document.createElement('div');
    roleButtons.className = 'flex gap-2';

    const teacherBtn = document.createElement('button');
    teacherBtn.type = 'button';
    teacherBtn.className = 'btn btn-secondary flex-1';
    teacherBtn.id = 'teacher-role-btn';
    teacherBtn.textContent = '👨‍🏫 Teacher';
    teacherBtn.onclick = () => this.selectRole('teacher', teacherBtn, studentBtn);

    const studentBtn = document.createElement('button');
    studentBtn.type = 'button';
    studentBtn.className = 'btn btn-primary flex-1';
    studentBtn.id = 'student-role-btn';
    studentBtn.textContent = '🎓 Student';
    studentBtn.onclick = () => this.selectRole('student', studentBtn, teacherBtn);

    roleButtons.appendChild(teacherBtn);
    roleButtons.appendChild(studentBtn);

    roleGroup.appendChild(roleLabel);
    roleGroup.appendChild(roleButtons);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary w-full mt-3';
    submitBtn.id = 'submit-btn';
    submitBtn.textContent = this.isLoginMode ? '🚀 Login' : '✨ Create Account';

    // Toggle mode link
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'text-center mt-3';

    const toggleLink = document.createElement('a');
    toggleLink.href = '#';
    toggleLink.id = 'toggle-link';
    toggleLink.style.color = '#00FFFF';
    toggleLink.style.textDecoration = 'none';
    toggleLink.textContent = this.isLoginMode
      ? "Don't have an account? Register"
      : 'Already have an account? Login';
    toggleLink.onclick = (e) => {
      e.preventDefault();
      this.toggleMode();
    };

    toggleDiv.appendChild(toggleLink);

    form.appendChild(errorDiv);
    form.appendChild(nameGroup);
    form.appendChild(emailGroup);
    form.appendChild(passwordGroup);
    form.appendChild(roleGroup);
    form.appendChild(submitBtn);
    form.appendChild(toggleDiv);

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(form);

    container.appendChild(card);

    return container;
  }

  selectRole(role, activeBtn, inactiveBtn) {
    this.selectedRole = role;
    activeBtn.className = 'btn btn-primary flex-1';
    inactiveBtn.className = 'btn btn-secondary flex-1';
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;

    const nameGroup = document.getElementById('name-group');
    const roleGroup = document.getElementById('role-group');
    const submitBtn = document.getElementById('submit-btn');
    const toggleLink = document.getElementById('toggle-link');

    nameGroup.style.display = this.isLoginMode ? 'none' : 'block';
    roleGroup.style.display = this.isLoginMode ? 'none' : 'block';

    submitBtn.textContent = this.isLoginMode ? '🚀 Login' : '✨ Create Account';
    toggleLink.textContent = this.isLoginMode
      ? "Don't have an account? Register"
      : 'Already have an account? Login';

    // Clear error
    const errorDiv = document.getElementById('error-message');
    errorDiv.style.display = 'none';

    // Set default role to student
    if (!this.isLoginMode) {
      this.selectedRole = 'student';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const errorDiv = document.getElementById('error-message');
    const submitBtn = document.getElementById('submit-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Loading...';

    try {
      let user;

      if (this.isLoginMode) {
        user = await this.authService.login(email, password);
      } else {
        const name = document.getElementById('name-input').value;
        const role = this.selectedRole || 'student';

        if (!name) {
          throw new Error('Please enter your name');
        }

        user = await this.authService.register(email, password, name, role);
      }

      errorDiv.style.display = 'none';
      this.onLoginSuccess(user);
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = this.isLoginMode ? '🚀 Login' : '✨ Create Account';
    }
  }
}
