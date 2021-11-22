import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { fireEvent } from "@testing-library/dom"
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from "../__mocks__/localStorage.js"
import firestore from "../app/Firestore.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    beforeEach(() => {            
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      const user = JSON.stringify({
        type: 'Employee'
      });
      window.localStorage.setItem('user', user);
      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH['NewBill'] } });
    })

    describe('I click on the X', () => {
      test("Should close the page", () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname }) 
        }
        const newBill = new NewBill({ document, onNavigate, firestore : firestore, localStorage: localStorageMock })
        const closeButton = screen.getByTestId('close');
        newBill.closeBill = jest.fn();
        closeButton.addEventListener('click', newBill.closeBill);
        fireEvent.click(closeButton);
        expect(newBill.closeBill).toBeCalled();
      })
    })

    describe("I select a file", () => {
      describe("A good type of file is selected", () => {
        test("Should upload the file", () => {
          const html = NewBillUI();
        document.body.innerHTML = html;
        const newBill = new NewBill({ document, onNavigate: window.location, firestore : firestore, localStorage: localStorageMock })
        const fileInput = screen.getByTestId('file');
        const fileExtension = new RegExp('^.+\.(jpg|jpeg|png)$', "i");
        newBill.handleChangeFile = jest.fn()
        fileInput.addEventListener("change", newBill.handleChangeFile);
        fireEvent.change(fileInput, {
          target: { files: [new File(['bill.jpg'], 'bill.jpg', { type: "image/jpg" })] }
        });
        const file = screen.getByTestId('file').files[0].name;
        expect(newBill.handleChangeFile).toHaveBeenCalled();
        expect(fileExtension.test(file)).toBeTruthy();
        expect(screen.getByTestId('error')).toBeFalsy();
        })
      })

      describe("A bad type of file is selected", () => {
        test("Should display an error", () => {
          const html = NewBillUI();
          document.body.innerHTML = html;
          const newBill = new NewBill({ document, onNavigate: window.location, firestore : firestore, localStorage: localStorageMock })
          const fileInput = screen.getByTestId('file');
          const fileExtension = new RegExp('^.+\.(jpg|jpeg|png)$', "i");
          newBill.handleChangeFile = jest.fn()
          fileInput.addEventListener("change", newBill.handleChangeFile);
          fireEvent.change(fileInput, {
            target: { files: [new File(['bill.pdf'], 'bill.pdf', { type: "application/pdf" })] }
          });
          const file = screen.getByTestId('file').files[0].name;
          expect(newBill.handleChangeFile).toHaveBeenCalled();
          expect(fileExtension.test(file)).toBeFalsy();
          expect(screen.getByTestId('error')).toBeTruthy();
        })
      })
    })
  })
})