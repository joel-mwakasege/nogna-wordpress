<?php
namespace Nogna\Billing\Dashboard;

defined('ABSPATH') || exit;

final class DashboardController
{
    public function register(): void
    {
        add_shortcode('nogna_dashboard', [$this, 'render']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('template_redirect', [$this, 'render_standalone_page']);
    }

    public function render_standalone_page(): void
    {
        $page_id = (int) get_option('nogna_dashboard_page_id', 0);

        $is_dashboard_page = $page_id && is_page($page_id);
        $has_dashboard_shortcode = is_singular() && has_shortcode(
            (string) get_post_field('post_content', get_queried_object_id()),
            'nogna_dashboard'
        );

        if (!$is_dashboard_page && !$has_dashboard_shortcode) {
            return;
        }

        if (!is_user_logged_in()) {
            auth_redirect();
        }

        status_header(200);
        nocache_headers();
        echo '<!doctype html><html ' . get_language_attributes() . '><head><meta charset="' . esc_attr(get_bloginfo('charset')) . '"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nogna Dashboard</title>';
        wp_head();
        echo '</head><body class="nogna-standalone">' . $this->render() . '</body></html>';
        wp_footer();
        exit;
    }

    public function render(): string
    {
        if (!is_user_logged_in()) {
            return '<div class="nogna-login-required">Please log in to access your Nogna dashboard.</div>';
        }

        ob_start();
        ?>
        <div id="nogna-dashboard" class="nogna-dashboard onboarding-active">
            <div id="nogna-onboarding" class="nogna-onboarding">
                <div class="nogna-onboarding-account">
                    <div class="nogna-account-avatar">◯</div>
                    <div><strong><?php echo esc_html(wp_get_current_user()->user_email); ?></strong><small>FREE</small></div>
                </div>

                <section class="nogna-onboarding-step is-active" data-onboarding-step="welcome">
                    <div class="nogna-welcome-mark">N</div>
                    <p class="nogna-onboarding-eyebrow">WELCOME TO NOGNA</p>
                    <h2>Nogna handles</h2>
                    <h2 class="nogna-blue-text">your financial workspace.</h2>
                    <div class="nogna-onboarding-actions">
                        <button class="nogna-start-button" data-start-onboarding>Set up my workspace <span>→</span></button>
                    </div>
                </section>

                <section class="nogna-onboarding-step" data-onboarding-step="identity">
                    <div class="nogna-step-heading"><h2>Company Identity</h2><p>What is your company's name?</p></div>
                    <div class="nogna-form-card">
                        <h3>GENERAL INFORMATION</h3>
                        <label>Company Name <em>*</em><input id="nogna-onboarding-name" placeholder="Your company name" required></label>
                        <div class="nogna-form-row">
                            <label>Trade Name<input placeholder="e.g. Brand Name"></label>
                            <label>Company Suffix<input placeholder="e.g. Department, Branch Office"></label>
                        </div>
                        <div class="nogna-form-row">
                            <label>Owner<input value="<?php echo esc_attr(wp_get_current_user()->display_name); ?>"></label>
                            <label>Legal Form<select><option>Self-employed/Freelancer</option><option>Limited company</option><option>Partnership</option></select></label>
                        </div>
                    </div>
                </section>

                <section class="nogna-onboarding-step" data-onboarding-step="contact">
                    <div class="nogna-step-heading"><h2>Contact Details</h2><p>Contact information for your customers</p></div>
                    <div class="nogna-form-card">
                        <h3>CONTACT INFORMATION</h3>
                        <label>Contact Person<input id="nogna-contact-person" value="<?php echo esc_attr(wp_get_current_user()->display_name); ?>"></label>
                        <div class="nogna-form-row">
                            <label>Email Address<input id="nogna-contact-email" value="<?php echo esc_attr(wp_get_current_user()->user_email); ?>"></label>
                            <label>Phone Number<input id="nogna-contact-phone" placeholder="+255..."></label>
                        </div>
                        <label>Website<input placeholder="yourcompany.com"></label>
                    </div>
                    <div class="nogna-form-card nogna-electronic-card">
                        <h3>ELECTRONIC INVOICE ADDRESS</h3>
                        <label>Electronic Address<input placeholder="billing@example.com"></label>
                    </div>
                </section>

                <div class="nogna-onboarding-footer">
                    <button class="nogna-back-button" data-onboarding-back>‹ <span>Back</span></button>
                    <div class="nogna-progress"><i class="is-active"></i><i></i><i></i><i></i><i></i><i></i></div>
                    <button class="nogna-next-button" data-onboarding-next>Next <span>→</span></button>
                </div>
            </div>
            <div id="nogna-app-content">
            <header class="nogna-topbar">
                <div>
                    <div class="nogna-eyebrow">NOGNA BILLING</div>
                    <h1>Overview</h1>
                </div>
                <div class="nogna-topbar-actions">
                    <label class="nogna-company-picker">
                        <span>Workspace</span>
                        <select id="nogna-company-select" aria-label="Select workspace"></select><button class="nogna-inline-action" data-open-company>+ Workspace</button>
                    </label>
                    <span class="nogna-user-pill"><?php echo esc_html(wp_get_current_user()->display_name); ?></span>
                </div>
            </header>

            <div id="nogna-notice" class="nogna-notice" role="status"></div>

            <div class="nogna-shell">
                <aside class="nogna-sidebar">
                    <div class="nogna-brand">nogna<span>.</span></div>
                    <nav>
                        <div class="nogna-nav-group">
                            <button class="is-active" data-section="overview"><span class="nogna-nav-icon">⌂</span>Home</button>
                        </div>
                        <div class="nogna-nav-label">MASTER DATA</div>
                        <div class="nogna-nav-group">
                            <button data-section="customers"><span class="nogna-nav-icon">◎</span>Customers</button>
                        </div>
                    </nav>
                    <div class="nogna-sidebar-company">
                        <strong><?php echo esc_html(wp_get_current_user()->display_name); ?></strong>
                        <span>Current workspace</span>
                    </div>
                </aside>

                <main class="nogna-content">
                    <section id="nogna-section-overview" class="nogna-section is-visible">
                        <div class="nogna-welcome">
                            <div>
                                <p class="nogna-muted">Your financial workspace</p>
                                <h2>Good to see you.</h2>
                            </div>
                            <button class="nogna-button" data-open-company>+ Create workspace</button><button class="nogna-button" data-open-customer>+ Add customer</button>
                        </div>
                        <div class="nogna-stat-grid">
                            <article class="nogna-stat-card"><span>Revenue</span><strong>—</strong><small>Invoices will appear here</small></article>
                            <article class="nogna-stat-card"><span>Outstanding</span><strong>—</strong><small>Track unpaid invoices</small></article>
                            <article class="nogna-stat-card"><span>Customers</span><strong id="nogna-customer-count">0</strong><small>Active customers</small></article>
                        </div>
                        <div class="nogna-empty-card">
                            <div class="nogna-empty-icon">✦</div>
                            <h3>Your workspace is ready</h3>
                            <p>Start by adding your first customer. Invoices, payments, expenses and reports will build on this foundation.</p>
                            <button class="nogna-button nogna-button-light" data-open-customer>Add your first customer</button>
                        </div>
                    </section>

                    <section id="nogna-section-customers" class="nogna-section">
                        <div class="nogna-page-heading">
                            <div><p class="nogna-muted">Relationships</p><h2>Customers</h2></div>
                            <button class="nogna-button" data-open-customer>+ Add customer</button>
                        </div>
                        <div class="nogna-toolbar">
                            <input id="nogna-customer-search" type="search" placeholder="Search customers..." />
                            <span id="nogna-customer-result-count" class="nogna-muted"></span>
                        </div>
                        <div class="nogna-table-card">
                            <table>
                                <thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Added</th><th></th></tr></thead>
                                <tbody id="nogna-customer-rows"><tr><td colspan="5" class="nogna-table-empty">Select a workspace to load customers.</td></tr></tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>

            <div id="nogna-company-modal" class="nogna-modal" aria-hidden="true">
                <div class="nogna-modal-backdrop" data-close-company></div>
                <div class="nogna-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="nogna-company-modal-title">
                    <button class="nogna-modal-close" data-close-company aria-label="Close">×</button>
                    <p class="nogna-muted">Workspace setup</p>
                    <h2 id="nogna-company-modal-title">Create workspace</h2>
                    <form id="nogna-company-form">
                        <label>Company name<input name="name" required maxlength="190" placeholder="e.g. KAVS Group" /></label>
                        <label>Workspace slug<input name="slug" maxlength="190" placeholder="e.g. kavs-group" /></label>
                        <div class="nogna-form-row">
                            <label>Currency<input name="base_currency" value="TZS" maxlength="3" /></label>
                            <label>Timezone<input name="timezone" value="Africa/Dar_es_Salaam" /></label>
                        </div>
                        <div class="nogna-modal-actions"><button type="button" class="nogna-button nogna-button-light" data-close-company>Cancel</button><button class="nogna-button" type="submit">Create workspace</button></div>
                    </form>
                </div>
            </div>

            <div id="nogna-customer-modal" class="nogna-modal" aria-hidden="true">
                <div class="nogna-modal-backdrop" data-close-customer></div>
                <div class="nogna-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="nogna-customer-modal-title">
                    <button class="nogna-modal-close" data-close-customer aria-label="Close">×</button>
                    <p class="nogna-muted">Customer details</p>
                    <h2 id="nogna-customer-modal-title">Add customer</h2>
                    <form id="nogna-customer-form">
                        <input type="hidden" name="id" />
                        <label>Full name<input name="name" required maxlength="190" /></label>
                        <div class="nogna-form-row">
                            <label>Email<input name="email" type="email" /></label>
                            <label>Phone<input name="phone" type="tel" /></label>
                        </div>
                        <div class="nogna-form-row">
                            <label>Tax number<input name="tax_number" /></label>
                            <label>City<input name="city" /></label>
                        </div>
                        <label>Notes<textarea name="notes" rows="3"></textarea></label>
                        <div class="nogna-modal-actions"><button type="button" class="nogna-button nogna-button-light" data-close-customer>Cancel</button><button class="nogna-button" type="submit">Save customer</button></div>
                    </form>
                </div>
            </div>
            </div>
            <nav class="nogna-mobile-nav" aria-label="Mobile navigation">
                <button class="is-active" data-section="overview"><span>⌂</span>Home</button>
                <button data-section="customers"><span>◉</span>Customers</button>
                <button data-open-customer class="nogna-mobile-add"><span>＋</span></button>
            </nav>
        </div>
        <?php
        return (string) ob_get_clean();
    }

    public function enqueue_assets(): void
    {
        if (!is_singular() || !has_shortcode((string) get_post_field('post_content', get_queried_object_id()), 'nogna_dashboard')) {
            return;
        }

        wp_enqueue_style('nogna-dashboard', NOGNA_BILLING_URL . 'assets/dashboard.css', [], NOGNA_BILLING_VERSION);
        wp_enqueue_script('nogna-dashboard', NOGNA_BILLING_URL . 'assets/dashboard.js', [], NOGNA_BILLING_VERSION, true);
        wp_script_add_data('nogna-dashboard', 'strategy', 'defer');
        wp_localize_script('nogna-dashboard', 'NognaDashboard', [
            'restUrl' => esc_url_raw(rest_url('nogna/v1')),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);
    }
}
