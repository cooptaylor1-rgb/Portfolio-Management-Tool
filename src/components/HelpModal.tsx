import { X, BookOpen, TrendingUp, Shield, DollarSign, PieChart } from 'lucide-react'

interface HelpModalProps {
  onClose: () => void
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Portfolio Management Guide</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close help modal">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <section className="help-section">
            <div className="help-icon">
              <BookOpen size={32} />
            </div>
            <h3>What is a Portfolio?</h3>
            <p>
              A portfolio is simply a collection of all your investments. Think of it like a basket 
              holding all your stocks, bonds, and other assets. This tool helps you track everything 
              in one place!
            </p>
          </section>

          <section className="help-section">
            <div className="help-icon">
              <TrendingUp size={32} />
            </div>
            <h3>Understanding Investment Types</h3>
            <ul className="help-list">
              <li>
                <strong>Stocks:</strong> Shares of ownership in a company. When the company does well, 
                your shares typically increase in value.
              </li>
              <li>
                <strong>ETFs (Exchange-Traded Funds):</strong> A basket of many stocks or bonds bundled 
                together. Great for diversification!
              </li>
              <li>
                <strong>Mutual Funds:</strong> Similar to ETFs but professionally managed. A fund manager 
                decides which investments to include.
              </li>
              <li>
                <strong>Bonds:</strong> Loans you give to governments or companies. They pay you interest 
                over time. Generally lower risk than stocks.
              </li>
              <li>
                <strong>Cryptocurrency:</strong> Digital currencies like Bitcoin. Highly volatile and 
                speculative.
              </li>
            </ul>
          </section>

          <section className="help-section">
            <div className="help-icon">
              <PieChart size={32} />
            </div>
            <h3>Understanding Key Terms</h3>
            <ul className="help-list">
              <li>
                <strong>Symbol/Ticker:</strong> A short code that identifies an investment (e.g., "AAPL" 
                for Apple Inc.). You can find these on financial websites.
              </li>
              <li>
                <strong>Quantity/Shares:</strong> How many units of the investment you own.
              </li>
              <li>
                <strong>Purchase Price:</strong> What you paid per share when you bought it.
              </li>
              <li>
                <strong>Current Price:</strong> What each share is worth right now in the market.
              </li>
              <li>
                <strong>Gain/Loss:</strong> How much money you've made (or lost) on an investment. 
                Green means profit, red means loss.
              </li>
              <li>
                <strong>Asset Allocation:</strong> How your money is distributed across different types 
                of investments. Diversifying helps reduce risk!
              </li>
            </ul>
          </section>

          <section className="help-section">
            <div className="help-icon">
              <Shield size={32} />
            </div>
            <h3>Investment Tips for Beginners</h3>
            <ul className="help-list">
              <li>
                <strong>Diversify:</strong> Don't put all your eggs in one basket. Spread investments 
                across different types and industries.
              </li>
              <li>
                <strong>Think Long-Term:</strong> Markets go up and down. Stay calm during downturns 
                and focus on your long-term goals.
              </li>
              <li>
                <strong>Update Regularly:</strong> Keep your current prices up to date to track your 
                true portfolio performance.
              </li>
              <li>
                <strong>Start Small:</strong> You don't need a lot of money to start. Begin with what 
                you're comfortable with.
              </li>
              <li>
                <strong>Do Your Research:</strong> Before investing, learn about what you're buying. 
                Never invest in something you don't understand.
              </li>
            </ul>
          </section>

          <section className="help-section">
            <div className="help-icon">
              <DollarSign size={32} />
            </div>
            <h3>How to Use This Tool</h3>
            <ol className="help-list">
              <li>Click <strong>"Add Investment"</strong> to start tracking a new investment</li>
              <li>Fill in the details - hover over the ⓘ icons for help with each field</li>
              <li>View your portfolio summary on the dashboard</li>
              <li>Update current prices by clicking the pencil icon next to any investment</li>
              <li>Watch your portfolio grow over time!</li>
            </ol>
          </section>

          <section className="help-section">
            <div className="help-icon">
              <BookOpen size={32} />
            </div>
            <h3>Keyboard Shortcuts</h3>
            <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Show Help</span>
                <code className="kbd">Ctrl + K</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Add Investment</span>
                <code className="kbd">Ctrl + N</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Close Modals</span>
                <code className="kbd">Esc</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Switch Tabs</span>
                <code className="kbd">Ctrl + 1-9</code>
              </div>
            </div>
          </section>

          <section className="help-section disclaimer">
            <p>
              <strong>⚠️ Important Disclaimer:</strong> This tool is for educational and tracking purposes 
              only. It does not provide financial advice. Always consult with a qualified financial advisor 
              before making investment decisions. Past performance does not guarantee future results.
            </p>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}