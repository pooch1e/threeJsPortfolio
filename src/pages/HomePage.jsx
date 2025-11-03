import NavBar from '../ui/NavBar';
export default function HomePage({ children }) {
  return (
    <main>
      <header className='flex p-4 justify-between align-middle'>
        <h1>Welcome to my portfolio</h1>
        <NavBar />
      </header>
      <div>{children}</div>
    </main>
  );
}
