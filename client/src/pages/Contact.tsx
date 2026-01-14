import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Clock, Send, Check } from 'lucide-react';

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-24">
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-display text-4xl md:text-5xl font-semibold mb-6">
            CONTACT
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Have a question about a piece? Interested in a commission? 
            We'd love to hear from you.
          </p>
        </motion.div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center mb-6">
                  <Check className="w-8 h-8" />
                </div>
                <h2 className="text-display text-2xl font-semibold mb-4">
                  MESSAGE SENT
                </h2>
                <p className="text-muted-foreground max-w-sm">
                  Thank you for reaching out. We'll get back to you within 
                  1-2 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                    data-testid="input-name"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    SUBJECT
                  </label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors appearance-none"
                    data-testid="select-subject"
                  >
                    <option value="">Select a subject</option>
                    <option value="artwork">Artwork Inquiry</option>
                    <option value="commission">Commission Request</option>
                    <option value="order">Order Status</option>
                    <option value="shipping">Shipping Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    MESSAGE
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors resize-none"
                    data-testid="textarea-message"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-foreground text-background px-8 py-4 text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2"
                  data-testid="button-send-message"
                >
                  SEND MESSAGE
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-12"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5" />
                <h3 className="text-display font-semibold">EMAIL</h3>
              </div>
              <a
                href="mailto:hello@studiodrop.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                hello@studiodrop.com
              </a>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5" />
                <h3 className="text-display font-semibold">STUDIO</h3>
              </div>
              <p className="text-muted-foreground">
                By appointment only
                <br />
                Brooklyn, New York
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5" />
                <h3 className="text-display font-semibold">RESPONSE TIME</h3>
              </div>
              <p className="text-muted-foreground">
                We typically respond within 1-2 business days.
                <br />
                For urgent inquiries, please indicate in subject.
              </p>
            </div>

            <div className="pt-8 border-t border-border">
              <h3 className="text-display font-semibold mb-4">FOLLOW</h3>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Twitter
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
