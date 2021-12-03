import { screen, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import Router from '../app/Router.js'
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import Firestore from '../app/Firestore.js'
import Bills from '../containers/Bills.js'
import firebase from '../__mocks__/firebase.js'


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
    describe("Then the page is loading", () => {
      test("Loading page should be rendered", () => {
        document.body.innerHTML = BillsUI({ loading: true });
        expect(screen.getAllByText('Loading...')).toBeTruthy();
      })
    })

    describe("Then there is an error", () => {
      test("Error page should be rendered", () => {
        document.body.innerHTML = BillsUI({ error: 'Error' });
        expect(screen.getByTestId('error-message')).toBeTruthy()
      })
    })

    describe("Then there is no bill", () => {
      test("No icon eye should be display", () => {
        document.body.innerHTML = BillsUI({ data: [] });     
        const firstIconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`)[0];
        expect(firstIconEye).toBeFalsy();
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
      test("Should open a modal", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const firstIconEye = screen.getAllByTestId("icon-eye")[0];
        const testBills = new Bills({ document, onNavigate, firestore: null, localStorage: localStorageMock });
        $.fn.modal = jest.fn();
        const handleClickIconEye = jest.fn(testBills.handleClickIconEye(firstIconEye));
        firstIconEye.addEventListener('click', handleClickIconEye);
        fireEvent.click(firstIconEye);
        expect(handleClickIconEye).toBeCalled();
        expect(document.getElementById('modaleFile')).toBeTruthy();
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
        expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
      })
    })
  })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
       const getSpy = jest.spyOn(firebase, "get");
       const bills = await firebase.get();
       expect(getSpy).toHaveBeenCalledTimes(1);
       expect(bills.data.length).toBe(4);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      document.body.innerHTML = BillsUI({ error: "Erreur 404" })
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      document.body.innerHTML = BillsUI({ error: "Erreur 500" })
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    });
  });
});