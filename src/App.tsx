import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Shubham from './components/Shubham';
import Education from './components/Education';
import Experience from './components/Experience';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Certifications from './components/Certifications';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  const [dark, setDark] = useState(false);

  // Sync dark mode with html
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  // Scroll to home section on page load
  useEffect(() => {
    const homeSection = document.getElementById('home');
    if (homeSection) {
      homeSection.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  // Smooth scroll for all anchor links
  useEffect(() => {
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const sectionId = target.getAttribute('href')!.slice(1);
        const section = document.getElementById(sectionId);
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <>
      <Navbar dark={dark} setDark={setDark} />
      <Shubham dark={dark} />
      <Education dark={dark} />
      <Experience dark={dark} />
      <Skills dark={dark} />
      <Projects dark={dark} />
      <Certifications dark={dark} />
      <Contact dark={dark} />
      <Footer dark={dark} />
    </>
  );
}

export default App;
