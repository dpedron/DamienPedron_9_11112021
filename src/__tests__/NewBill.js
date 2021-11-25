import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { fireEvent } from "@testing-library/dom"
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from "../__mocks__/localStorage.js"
import firestore from "../app/Firestore.js"
import firebase from "../__mocks__/firebase.js"
import BillsUI from "../views/BillsUI.js"

jest.mock('../app/Firestore.js')  

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
const user = JSON.stringify({
  type: 'Employee'
});
window.localStorage.setItem('user', user);

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname }) 
}

Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH['NewBill'] } });

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Should display the full form", () => {
      document.body.innerHTML = NewBillUI();
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();
      expect(screen.getByTestId('expense-type')).toBeTruthy();
      expect(screen.getByTestId('expense-name')).toBeTruthy();
      expect(screen.getByTestId('datepicker')).toBeTruthy();
      expect(screen.getByTestId('amount')).toBeTruthy();
      expect(screen.getByTestId('vat')).toBeTruthy();
      expect(screen.getByTestId('pct')).toBeTruthy();
      expect(screen.getByTestId('commentary')).toBeTruthy();
      expect(screen.getByTestId('file')).toBeTruthy();
    })

    describe('I click on the X', () => {
      test("Should close the page", () => {
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({ document, onNavigate, firestore, localStorage: localStorageMock })
        const closeButton = screen.getByTestId('close');
        newBill.closeBill = jest.fn();
        closeButton.addEventListener('click', newBill.closeBill);
        fireEvent.click(closeButton);
        expect(newBill.closeBill).toBeCalled();
      })
    })

    describe("I select a file", () => {
      describe("A good type of file is selected", () => {
        test("Should keep the file", () => {
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({ document, onNavigate, firestore, localStorage: localStorageMock });
        const file = screen.getByTestId('file');
        const fileExtension = new RegExp('^.+\.(jpg|jpeg|png)$', "i");
        newBill.handleChangeFile = jest.fn()
        file.addEventListener("change", newBill.handleChangeFile);
        fireEvent.change(file, {
          target: { files: [new File(['bill.jpg'], 'bill.jpg', { type: "image/jpg" })] }
        });
        expect(newBill.handleChangeFile).toHaveBeenCalled();
        expect(fileExtension.test(file.files[0].name)).toBeTruthy();
        expect(screen.getByTestId('error')).toBeFalsy();
        })
      })

      describe("A bad type of file is selected", () => {
        test("Should reject the file and display an error", () => {
          document.body.innerHTML = NewBillUI();
          const newBill = new NewBill({ document, onNavigate, firestore, localStorage: localStorageMock })
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

    describe("I submit the form", () => {
      test("New bill should be created", () => {
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({ document, onNavigate, firestore, localStorage: localStorageMock });
        const bill = {
          email : 'damien@damien.fr',
          type: 'Transports',
          name:  'London',
          amount: 200,
          date:  '23-11-2021',
          vat: 70,
          pct: 10,
          commentary: 'Flight ticket to London',
          fileUrl: './london.jpg',
          fileName: 'london.jpg',
          status: 'pending'
        };
        newBill.createBill = (newBill) => newBill;
        screen.getByTestId('expense-type').value = bill.type;
        screen.getByTestId('expense-name').value = bill.name;
        screen.getByTestId('datepicker').value = bill.amount;
        screen.getByTestId('amount').value = bill.date;
        screen.getByTestId('vat').value = bill.vat;
        screen.getByTestId('pct').value = bill.pct || 20;
        screen.getByTestId('commentary').value = bill.commentary;
        newBill.fileUrl = bill.fileUrl;
        newBill.fileName = bill.fileName;   
        const form = screen.getByTestId("form-new-bill");
        const submitBtn = screen.getByText("Envoyer");  
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));       
        newBill.onNavigate = jest.fn();
        form.addEventListener("submit", handleSubmit);
        submitBtn.click();
        expect(handleSubmit).toHaveBeenCalled();
      })
    })
  })
})

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I submit a new bill", () => {
    test("POST bill to API", async () => {
       const postSpy = jest.spyOn(firebase, "post");
       const bill = {
        id: "azerty123",
        vat: 70,
        fileUrl: "./london.jpg",
        status: "pending",
        type: "Transports",
        commentary: "Flight ticket to London",
        name: "London",
        fileName: "london.jpg",
        date: "23-11-2021",
        amount: 200,
        commentAdmin: "ok",
        email: "damien@damien.fr",
        pct: 10
      }
       const bills = await firebase.post(bill);
       expect(postSpy).toHaveBeenCalledTimes(1);
       expect(bills.data.length).toBe(5);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      document.body.innerHTML = BillsUI({ error: "Erreur 404" })
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      document.body.innerHTML = BillsUI({ error: "Erreur 500" })
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    });
  });
});