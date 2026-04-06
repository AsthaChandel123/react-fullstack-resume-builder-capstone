import EmployerCriteriaList from '../bridge/components/EmployerCriteriaList';

export default function EmployerCriteria() {
  return (
    <main id="main-content" className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">My Criteria</h1>
        <EmployerCriteriaList />
      </div>
    </main>
  );
}
