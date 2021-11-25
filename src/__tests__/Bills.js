import { screen, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import Router from '../app/Router.js'
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import Firestore from '../app/Firestore.js'
import Bills from '../containers/Bills.js'


Object.defineProperty(window, 'localStorage', { value: localStorageMock })
const user = JSON.stringify({
  type: 'Employee'
});
window.localStorage.setItem('user', user);

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname }) 
}

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    describe("The page is loading", () => {
      test("Loading page should be rendered", () => {
        document.body.innerHTML = BillsUI({ loading: true });
        expect(screen.getAllByText('Loading...')).toBeTruthy();
      })
    })

    describe("There is an error", () => {
      test("Error page should be rendered", () => {
        document.body.innerHTML = BillsUI({ error: 'Error' });
        expect(screen.getByTestId('error-message')).toBeTruthy()
      })
    })

    test("Then bill icon in vertical layout should be highlighted", () => {
      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH['Bills'] } });
      document.body.innerHTML = `<div id="root"></div>`;
      Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue()});
      Router();
      expect(screen.getByTestId('icon-window').classList.contains("active-icon")).toBeTruthy();
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe('Then click on icon eye', () => {
      test("should open a modal", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const firstIconEye = screen.getAllByTestId("icon-eye")[0];
        const testBills = new Bills({ document, onNavigate, firestore: null, localStorage: localStorageMock });
        testBills.handleClickIconEye = jest.fn();
        firstIconEye.addEventListener('click', testBills.handleClickIconEye);
        fireEvent.click(firstIconEye);
        expect(testBills.handleClickIconEye).toBeCalled();
      })
      test("and should display bill proof", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const firstIconEye = screen.getAllByTestId("icon-eye")[0];
        const testBills = new Bills({ document, onNavigate, firestore: null, localStorage: localStorageMock });
        $.fn.modal = jest.fn();
        testBills.handleClickIconEye(firstIconEye);
        expect(document.querySelector(".modal")).toBeTruthy();  

      })
    })

    describe('Then click on new bill button', () => {
      test('should open a new bill modal', () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const testBills = new Bills({ document, onNavigate, firestore: null, localStorage: localStorageMock });
        const buttonNewBill = screen.getByTestId("btn-new-bill")
        testBills.handleClickNewBill = jest.fn();
        buttonNewBill.addEventListener("click", testBills.handleClickNewBill);
        fireEvent.click(buttonNewBill);
        expect(testBills.handleClickNewBill).toBeCalled();
      })
    })
  })
})