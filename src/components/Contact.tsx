import React, { useEffect, useState } from 'react';
import { ref, onValue, push } from 'firebase/database';
import { db } from '../firebase';

interface ContactData {
  heading: string;
  font?: string;
  textColor?: string;
  backgroundColor?: string;
  darkBackgroundColor?: string;
  darkTextColor?: string;
  placeholders: {
    name: string;
    email: string;
    message: string;
  };
  buttonText: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

export default function Contact({ dark }: { dark: boolean }) {
  const [data, setData] = useState<ContactData | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const contactRef = ref(db, 'contact');
    const unsubscribe = onValue(contactRef, (snapshot) => {
      if (snapshot.exists()) setData(snapshot.val());
    });
    return () => unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setStatus('Please fill all fields.');
      return;
    }

    try {
      await push(ref(db, 'messages'), {
        name,
        email,
        message,
        createdAt: Date.now(),
      });
      setStatus('');
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error(err);
      setStatus('Failed to send message.');
    }
  };

  return (
    <section
      id="contact"
      className="section transition-colors duration-300 py-16"
      style={{
        fontFamily: data?.font || 'inherit',
        color: dark ? data?.darkTextColor || 'inherit' : data?.textColor || 'inherit',
        backgroundColor: dark
          ? data?.darkBackgroundColor || 'inherit'
          : data?.backgroundColor || 'inherit',
      }}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl">
        {data && (
          <>
            <h2 className="text-3xl font-bold mb-8 text-center">{data.heading}</h2>

            {!submitted ? (
              <form onSubmit={submit} className="grid gap-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={data.placeholders.name}
                  className="p-3 rounded bg-white/5 text-black dark:text-white dark:bg-black/20 focus:ring-2 focus:ring-teal-400 outline-none transition w-full"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={data.placeholders.email}
                  className="p-3 rounded bg-white/5 text-black dark:text-white dark:bg-black/20 focus:ring-2 focus:ring-teal-400 outline-none transition w-full"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={data.placeholders.message}
                  className="p-3 rounded bg-white/5 text-black dark:text-white dark:bg-black/20 h-32 focus:ring-2 focus:ring-teal-400 outline-none transition w-full"
                />
                <button
                  type="submit"
                  className="btn w-full md:w-fit px-4 py-2 rounded transition-transform hover:scale-105 mx-auto"
                  style={{
                    backgroundColor: data.buttonBgColor || '#14b8a6',
                    color: data.buttonTextColor || '#000',
                  }}
                >
                  {data.buttonText}
                </button>
                {status && <p className="text-center text-slate-400 mt-2">{status}</p>}
              </form>
            ) : (
              <p className="text-center text-xl text-teal-500 mt-4">
                Thank you for your message! 😊
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
